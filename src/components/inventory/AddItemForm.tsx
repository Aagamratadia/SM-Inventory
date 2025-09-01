"use client";

import React, { useState } from "react";
import Select from "react-select";

import { IItem } from "@/models/Item";
const CATEGORY_ITEMS: Record<string, string[]> = {
  DIAMOND: [
    "HELIUM PRINT PAPER",
    "VANIYER CELL SMALL",
    "VANIYER CELL LARGE",
    "VANIYER GREEN",
    "EAR BUDS TULIPS",
    "TREY PLAIN 10*14",
    "TREY PLAIN 12*15",
    "TREY KHANA WALI",
    "NATRAJ LAAKH (SEAL)",
    "AMARI WHEEL SHIV",
    "AMARI WHEEL FALKAN",
    "VIP POWDER",
    "ACETON  NORMAL 1LITRE",
    "VITOX CHARI PANI 1LITRE",
    "LIQUID 1 LITRE",
    "LAL OIL 1LITRE",
    "ACETON 5 LITRE",
    "TOLIN 5 LITRE",
    "MARK ACETON 500 ML",
    "CHARI PANI G4 1 LITRE",
    "MAGNET",
    "CARBON",
    "PICHHI NO 6",
    "ROUGH PAD LARGE",
    "ROUGH PAD SMALL",
    "PLASTIC PUPI SMALL",
    "PLASTIC PUPI LARGE",
    "MAGNET LIGHT",
    "EYE GLASS BLACK",
    "14X EYE GLASS STEEL",
    "CHIPIYA STEEL",
    "TAPARIYA CHANCH PAKAD",
    "SHADE CARD",
    "TREY BRUSH",
    "GLUE DABBI",
    "LESAR LIGHT",
    "MAXI COOLET 8 MM",
    "MAXI NUT 8 MM",
    "CHAG 8 MM",
    "RASIYAN CHAG",
    "VASH COVER RICO",
    "BOTTOM DAI MM 7",
    "BOTTOM DAI MM 8",
    "BOTTOM DAI MM 9",
    "BOTTOM DAI MM 10",
    "BOTTOM DAI MM BIG",
    "TOP DAI S S",
    "SEMI PICKUP",
    "SEMI ANGUR",
    "MATTI DABBA",
    "ALCON DAI BOX",
    "RUBBER DATTI",
    "WHITENAR SUPER 108",
    "DESI KATORI GHISI",
    "TOPI LEVAL",
    "POWDER DISH",
    "TOP CLAW NAKH 2.5",
    "TOP CLAW NAKH 3.0",
    "TOP CLAW NAKH3.5",
    "T PANNA 3 MM",
    "T PANNA 4 MM",
    "KACH PAPER NO 150",
    "KACH PAPER NO 1000",
    "W D 40 SPRAY",
    "CHOMO ROLL 30+25",
    "CHIPIYA NAKH HEAVY",
    "HARPIK 1 LITER",
    "RASIYAN MEXI DAI  SS",
    "TABLE TUBE",
    "VANKIYA [ DATARADU ]",
    "CHANDLA COTTED",
    "MICRO BEAKER",
    "L BOLT 3*4",
    "L PANNA NO 2",
    "MICRO INK",
    "LAL JUTTAR",
    "TAR BRUSH",
    "MEXI SUPPORT DAI",
    "RICO OIL 1 LITER",
    "MAGNET MEXI",
    "MICRO SCOPE SALI",
    "KUMI AMARI NANI",
    "GARANI NANI",
    "SEMI ANGUR PAYA",
    "L PANNA NO 2.5",
    "HYDROFLORIC ACID LAL 500 ML",
    "RICO PAYA DATTY",
    "DESI KATORI DAI BOLT",
    "L BOLT 2.5",
    "MEXI PANI MOTAR",
    "BEAKER 150 ML",
    "HIRA SUPADI NO 2",
    "TREY PLAIN 4*6",
    "WHITE PACKET NO 3",
    "DABBI WHITE",
    "LARIYA",
    "THALA GHANTI",
    "HAND GLOVES YELLOW",
    "HAND GLOVES BLUE",
    "45 HOLE MEXI PLATE",
    "S P AMARI WHILL",
    "L BOLT CHAG",
    "CLICK RING 96",
    "BOTTOM CLAW HOLDER",
    "DAIL POINT DAILIT",
    "CHARANI MOTI",
    "SARIN DABBI",
    "DAILIT L BOLT 4*10",
    "DAILIT L BOLT 3*6",
    "DAILIT L BOLT 3*8",
    "GAB SCREW",
    "S S CAP SCREW",
    "FIBRE DABBI SMALL",
    "KHANAS TRIKON",
    "PAPER WEIGHT",
  ],
  ELECTRIC: [
    "18 W PLC LED",
    "6A TOP PIN",
    "MAICRO YELLOW LIGHT [36]",
    "TELEPHONE RECIVER WIRE",
    "MAICRO LIGHT PHILIPS",
    "U V LIGHT",
    "U V GLUE",
  ],
  GENERAL: ["ALL GROCERIES ITEM AND VEGETABLES ITEM LIST"],
  MEDICAL: [
    "DETTOL 125 ML",
    "GYPSUN COTTON ROLL",
    "KOHINOOR PATTA",
    "PERACETAMOL TAB.500",
    "GASTRO RESISTANT TB.IP 75",
    "VICKS VAPORAB 25 ML",
    "SOFRAMYCIN 30 GM",
    "MEDISTRIP",
    "MEDIGRIP",
  ],
  MISC: [
    "BOSTIK GUM PACKET",
    "SELVET MD WHITE",
    "SELVET MD BLUE",
    "SELVET WHITE SHREE NATHJI",
    "SELVET BLUE",
    "TISSUE PAPER",
    "STICKY NOTES",
    "LESAR PANA GLORI",
    "PLASTIC DABBA NO 22",
    "PLASTIC DABBA NO 33",
    "PLASTIC DABBA NO 44",
    "PLASTIC DABBA NO 55",
    "PLASTIC DABBA NO 66",
    "PLASTIC DABBA NO 77",
    "PLASTIC DABBA NO 88",
    "PLASTIC DABBA NO 99",
    "PLASTIC DABBA NO 101",
    "PLASTIC DABBA NO 102",
    "PLASTIC DABBA NO 103",
    "PLASTIC DABBA NO 104",
    "HAND WASH BOTTLE",
    "DUST BIN",
    "CHAIR WHEEL",
    "AGARBATI LARGE",
    "LOOSE  TUKADA CLOTH",
  ],
  STATIONERY: [
    "CELOTAPE SMALL",
    "CELOTAPE MEDIUM",
    "CELOTAPE LARGE",
    "KHAKHI  TAPE ROLL",
    "TAPEROLL STAND SMALL",
    "TAPEROLL STAND LARGE",
    "KP DAYARI NO 1",
    "KP DAYARI NO 2",
    "KP DAYARI NO 3",
    "KP DAYARI NO 4",
    "JK A4 PAPER",
    "STIC POINT",
    "STIC INK BLUE",
    "STIC INK BLACK",
    "STIC INK RED",
    "STIC PEN BLUE",
    "STIC PEN BLACK",
    "STIC PEN RED",
    "STIC PEN GREEN",
    "STIC PEN ORANGE",
    "STIC PEN PINK",
    "STIC PEN  BLUE",
    "STIC PEN PURPLE",
    "PENCIL 05",
    "PENCIL 07",
    "PENCIL 09",
    "PENCIL LID 05",
    "PENCIL LID 07",
    "PENCIL LID 09",
    "RUBBER SMALL",
    "RUSHIT PEN BLACK",
    "RUSHIT PEN RED",
    "RUSHIT PEN GREEN",
    "RUSHIT PEN BLUE",
    "F1 JIG PEN BLACK",
    "F1 JIG PEN BLUE",
    "F1 JIG PEN RED",
    "F1 JIG PEN GREEN",
    "CD DVD PEN BLACK",
    "CD DVD PEN RED",
    "CD DVD PEN GREEN",
    "CD DVD PEN BLUE",
    "BALLPEN SS PINLOG",
    "ERASER PEN",
    "HILITER PEN YELLOW",
    "HILITER PEN GREEN",
    "HILITER PEN BLUE",
    "HILITER PEN PINK",
    "HILITER PEN ORANGE",
    "HILITER INK YELLOW",
    "HILITER INK GREEN",
    "HILITER INK BLUE",
    "HILITER INK PINK",
    "HILITER INK ORANGE",
    "WHITENER PEN",
    "RUBBER RING SMALL",
    "RUBBER RING MEDIUM",
    "RUBBER RING LARGE",
    "BINDER CLIP SMALL",
    "FEVIKWIK",
    "CALCULATOR",
    "MARKER PEN LARGE JADI",
    "STAPLAR PIN LARGE",
    "STAPLAR PIN SMALL no 10",
    "STAPLAR SMALL",
    "STAPLAR LARGE",
    "THERMAL PAPER ROLL 79+50",
    "THERMAL PAPER ROLL 60+65",
    "STICKER ROLL 90+35",
    "PENCIL CELL LARGE",
    "PENCIL CELL SMALL",
    "PUNCHING MASCHINE LARGE",
    "STEEL SCALE",
    "PENCIL  DOMS",
    "RUSHIT POINT",
    "SCISSORS SMALL",
    "ANGADIYA COVER",
    "FEVISTIK",
    "HAJARI PATRAK",
    "LINER 005 PEN",
    "FOLDER A4 PLASTIC FILE",
    "ANGADIYA COVER  14+18",
    "STIK INC ORANGE",
    "EPSON 664 BLACK INK",
    "SCISSORS LARGE",
    "ANGADIYA COVER  12*16",
  ],
};

interface AddItemFormProps {
  onSuccess: (newItem: IItem) => void;
  onClose: () => void;
  isScrap?: boolean;
}

export default function AddItemForm({ onSuccess, onClose, isScrap = false }: AddItemFormProps) {
  const [formData, setFormData] = useState({
    category: "",
    name: "",
    vendorname: "",
    quantity: "",
    price: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Build options for the Item Name select, appending an "Add new item..." option at the end
  const itemOptions = formData.category
    ? [
        ...(CATEGORY_ITEMS[formData.category]?.map((itemName) => ({
          value: itemName,
          label: itemName,
        })) || []),
        { value: "__ADD_NEW__", label: "Add new item..." },
      ]
    : [];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError("Item name is required.");
      return;
    }
    // Validate quantity and price
    const qtyNum = formData.quantity !== "" ? Number(formData.quantity) : NaN;
    const priceNum = formData.price !== "" ? Number(formData.price) : NaN;
    if (!Number.isFinite(qtyNum)) {
      setError("Quantity is required and must be a number.");
      return;
    }
    if (!Number.isFinite(priceNum)) {
      setError("Price is required and must be a number.");
      return;
    }
    if (qtyNum < 0) {
      setError("Quantity cannot be negative.");
      return;
    }
    if (priceNum < 0) {
      setError("Price cannot be negative.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quantity: qtyNum,
          price: priceNum,
          isScrap,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create item");
      }

      const newItem = await res.json();
      onSuccess(newItem);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700"
        >
          Item Category <span className="text-red-600">*</span>
        </label>
        <select
          name="category"
          id="category"
          value={formData.category}
          onChange={(e) => {
            setFormData((prev) => ({
              ...prev,
              category: e.target.value,
              name: "", // Reset name when category changes
            }));
          }}
          required
          className="mt-1 block w-full px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select Category</option>
          {Object.keys(CATEGORY_ITEMS).map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Item Name <span className="text-red-600">*</span>
        </label>
        <Select
          inputId="name"
          name="name"
          isDisabled={!formData.category}
          isSearchable
          options={itemOptions}
          value={
            formData.name
              ? { value: formData.name, label: formData.name }
              : null
          }
          onChange={(option) => {
            if (option?.value === "__ADD_NEW__") {
              const input = window.prompt("Enter new item name");
              const newName = (input || "").trim();
              if (newName) {
                setFormData((prev) => ({ ...prev, name: newName }));
              }
              return;
            }
            setFormData((prev) => ({
              ...prev,
              name: option ? option.value : "",
            }));
          }}
          placeholder="Select Item Name"
          required
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Vendor Name <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          name="vendorname"
          id="vendorname"
          value={formData.vendorname}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
            Quantity <span className="text-red-600">*</span>
          </label>
          <input
            id="quantity"
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min={0}
            step={1}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price <span className="text-red-600">*</span>
          </label>
          <input
            id="price"
            type="number"
            name="price"
            placeholder="Price"
            value={formData.price}
            onChange={handleChange}
            required
            min={0}
            step={0.01}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
          />
        </div>
      </div>
      <div>
        <textarea
          name="notes"
          placeholder="Notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
        ></textarea>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {submitting ? "Adding..." : "Add Item"}
        </button>
      </div>
    </form>
  );
}
