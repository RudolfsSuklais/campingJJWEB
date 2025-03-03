import { createContext, useContext, useState } from "react";

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
    const [isAdults, setIsAdults] = useState(0);

    return (
        <BookingContext.Provider value={{ isAdults, setIsAdults }}>
            {children}
        </BookingContext.Provider>
    );
};

export const useBooking = () => useContext(BookingContext);
