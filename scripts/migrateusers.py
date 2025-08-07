# main.py
import pymongo
import bcrypt
import csv
import os
from pymongo.errors import ConnectionFailure, OperationFailure

# --- Configuration ---
# Updated with your MongoDB Atlas connection string.
MONGO_URI = "mongodb+srv://aagamratadiasm:pypvog-hodsEv-radqu0@sm-inventory.nlvmqku.mongodb.net/?retryWrites=true&w=majority&appName=SM-Inventory"
DB_NAME = "sm-inventory"      # The name of the database to use
COLLECTION_NAME = "users"     # The name of the collection to store users in
DEFAULT_PASSWORD = "123456"   # The default password for all new users

# --- File Path Configuration (Robust Path Handling) ---
# This makes sure the script finds the CSV file even if you run it from a different directory.
# The script will look for the CSV file in the same folder it is located in.
try:
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
except NameError:
    # __file__ is not defined in interactive environments, so we'll use the current working directory as a fallback.
    SCRIPT_DIR = os.getcwd()

# --- UPDATE ---
# Changed the filename to match the new file you provided.
CSV_FILE_NAME = "users.csv"
CSV_FILE_PATH = os.path.join(SCRIPT_DIR, CSV_FILE_NAME)


def get_db_connection(uri):
    """
    Establishes a connection to the MongoDB database.
    Returns the database client object or None if connection fails.
    """
    try:
        # Added appName to the client for better identification in Atlas logs
        client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000, appName="user-importer-script")
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        print("✅ MongoDB connection successful.")
        return client
    except ConnectionFailure as e:
        print(f"❌ Could not connect to MongoDB: {e}")
        return None

def hash_password(plain_text_password):
    """
    Hashes a password using bcrypt.
    Returns the hashed password as a decoded string.
    """
    password_bytes = plain_text_password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password_bytes = bcrypt.hashpw(password_bytes, salt)
    # Decode the hashed password from bytes to a string before returning.
    # This stores it as a readable string in MongoDB instead of a Binary object.
    return hashed_password_bytes.decode('utf-8')

def read_users_from_csv(file_path):
    """
    Reads user data from a specified CSV file.
    The CSV file must have 'code no', 'employee name', and 'department' headers.
    """
    if not os.path.exists(file_path):
        print(f"❌ Error: The file was not found at the expected path: '{file_path}'")
        print(f"Please make sure the file '{CSV_FILE_NAME}' is in the same directory as the script.")
        return []

    try:
        # Changed encoding from 'utf-8' to 'latin-1' to handle non-standard characters
        # often found in CSV files exported from Excel.
        with open(file_path, mode='r', encoding='latin-1') as csvfile:
            reader = csv.DictReader(csvfile)
            
            # Clean up the headers (keys) from the CSV data by stripping whitespace.
            # This makes the script robust against extra spaces in column names
            # (e.g., " employee name " becomes "employee name").
            cleaned_users = []
            for row in reader:
                # This will filter out any empty columns that might exist in the CSV
                cleaned_row = {key.strip(): value for key, value in row.items() if key and key.strip()}
                if cleaned_row: # Ensure the row is not empty after cleaning
                    cleaned_users.append(cleaned_row)

            users = cleaned_users
            print(f"✅ Successfully read {len(users)} users from '{file_path}'.")
            return users
    except Exception as e:
        print(f"❌ Failed to read or process CSV file: {e}")
        return []

def add_users_to_db(users_to_add):
    """
    Main function to connect to the database and add users.
    """
    if not users_to_add:
        print("No users to add. Exiting.")
        return

    client = get_db_connection(MONGO_URI)
    if not client:
        print("Exiting script due to connection failure.")
        return

    try:
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        
        print(f"\nAdding {len(users_to_add)} users to the '{COLLECTION_NAME}' collection...")

        hashed_default_password = hash_password(DEFAULT_PASSWORD)

        for user_data in users_to_add:
            # --- Create the user document ---
            # Accessing data using the cleaned column names.
            employee_name = user_data["employee name"]
            
            # Generate a simple email from the user's name
            email_name = employee_name.lower().replace(" ", ".")
            # --- UPDATE ---
            # Changed the email domain to @gmail.com
            email = f"{email_name}@gmail.com"

            user_document = {
                "name": employee_name,
                "email": email,
                "password": hashed_default_password,
                "role": "staff",
                "code_no": user_data["code no"],
                "department": user_data["department"]
            }

            # Use update_one with upsert=True to avoid creating duplicates
            result = collection.update_one(
                {"email": user_document["email"]},
                {"$set": user_document},
                upsert=True
            )

            if result.upserted_id:
                print(f"  -> Successfully created user: {user_document['name']} ({user_document['email']})")
            elif result.matched_count > 0:
                print(f"  -> Successfully updated user: {user_document['name']} ({user_document['email']})")

        print("\n✅ All users have been processed.")

    except OperationFailure as e:
        print(f"❌ An operation failed: {e.details}")
    except KeyError as e:
        print(f"❌ A required column is missing from the CSV file: {e}. Please check the CSV headers.")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
    finally:
        if client:
            client.close()
            print("MongoDB connection closed.")

if __name__ == "__main__":
    # 1. Read users from the CSV file using the dynamically found path
    users = read_users_from_csv(CSV_FILE_PATH)
    
    # 2. If users were read successfully, add them to the database
    if users:
        add_users_to_db(users)
