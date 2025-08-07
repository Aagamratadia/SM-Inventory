# delete_users.py
import pymongo
from pymongo.errors import ConnectionFailure, OperationFailure

# --- Configuration ---
# Make sure this matches the database you want to modify.
MONGO_URI = "mongodb+srv://aagamratadiasm:pypvog-hodsEv-radqu0@sm-inventory.nlvmqku.mongodb.net/?retryWrites=true&w=majority&appName=SM-Inventory"
DB_NAME = "sm-inventory"  # The name of the database
COLLECTION_NAME = "users" # The name of the collection

def get_db_connection(uri):
    """
    Establishes a connection to the MongoDB database.
    Returns the database client object or None if connection fails.
    """
    try:
        client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000, appName="user-deleter-script")
        client.admin.command('ismaster')
        print("✅ MongoDB connection successful.")
        return client
    except ConnectionFailure as e:
        print(f"❌ Could not connect to MongoDB: {e}")
        return None

def delete_users_by_role():
    """
    Connects to the database and deletes all users with the 'user' role.
    """
    client = get_db_connection(MONGO_URI)
    if not client:
        print("Exiting script due to connection failure.")
        return

    try:
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        # Define the filter to find all documents with role: "user"
        query = {"role": "user"}

        # First, count how many users will be deleted to inform the user.
        count = collection.count_documents(query)

        if count == 0:
            print("No users found with the role 'user'. No action taken.")
            return

        # --- SAFETY CONFIRMATION ---
        # Ask for explicit confirmation before deleting data.
        print(f"\n⚠️  You are about to delete {count} user(s) from the '{COLLECTION_NAME}' collection.")
        print("This action cannot be undone.")
        confirmation = input("To confirm, please type 'yes' and press Enter: ")

        if confirmation.lower() != 'yes':
            print("\nDeletion cancelled by user.")
            return

        # --- DELETION ---
        # If confirmed, proceed with deleting the documents.
        print("\nDeleting users...")
        result = collection.delete_many(query)
        
        print(f"\n✅ Success! {result.deleted_count} user(s) have been deleted.")

    except OperationFailure as e:
        print(f"❌ An operation failed: {e.details}")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
    finally:
        # Ensure the connection is closed
        if client:
            client.close()
            print("MongoDB connection closed.")

if __name__ == "__main__":
    delete_users_by_role()
