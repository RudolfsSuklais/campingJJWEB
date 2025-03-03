import React, { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import "./NavBar.css";

function NavBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > lastScrollY) {
                setIsOpen(false);
            }
            setLastScrollY(window.scrollY);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    return (
        <header>
            <div className="container">
                <div className="menus">
                    <Link to="/">
                        <img
                            src="https://res.cloudinary.com/dq3svbwy6/image/upload/v1739300132/JJLogo_sz0xko.png"
                            alt="Jurmalciems Camping Logo"
                        />
                    </Link>
                    <nav>
                        <ul className={isOpen ? "display" : ""}>
                            <div
                                className="btn"
                                onClick={() => setIsOpen(false)}
                            >
                                <i className="fas fa-times close-btn"></i>
                            </div>
                            <li onClick={() => setIsOpen(false)}>
                                <NavLink to="/">Home</NavLink>
                            </li>
                            <li onClick={() => setIsOpen(false)}>
                                <NavLink to="/pricing">Pricing</NavLink>
                            </li>
                            <li onClick={() => setIsOpen(false)}>
                                <NavLink to="/about">About</NavLink>
                            </li>
                            <li onClick={() => setIsOpen(false)}>
                                <NavLink to="/contact">Contact</NavLink>
                            </li>
                        </ul>
                    </nav>
                    <div className="btn" onClick={() => setIsOpen(true)}>
                        <i className="fas fa-bars menu-btn"></i>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default NavBar;
