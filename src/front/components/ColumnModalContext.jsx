import React, { createContext, useContext, useState } from 'react';

const ColumnModalContext = createContext();

export function ColumnModalProvider({ children }) {
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    plate_number: true,
    municipio: true,
    camera_name: true,
    vehicle_make: true,
    vehicle_model: true,
    vehicle_color: true,
    direction: true,
    detected_at: true,
    confidence: false,
    image_url: false
  });


  return (
    <ColumnModalContext.Provider
      value={{ showColumnModal, setShowColumnModal, columnVisibility, setColumnVisibility }}
    >
      {children}
    </ColumnModalContext.Provider>
  );
}

export function useColumnModal() {
  return useContext(ColumnModalContext);
}
