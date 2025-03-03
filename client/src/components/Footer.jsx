import React from "react";
import "./Footer.css";

function Footer() {
    return (
        <div className="footer">
            <div className="info-about">
                <h2>Jūrmalciems Camping</h2>
                <p>
                    <a href="https://maps.app.goo.gl/jPMwaEQhA2LiricD6">
                        <i className="fa-solid fa-location-dot"></i>&nbsp;&nbsp;
                        Jēkabi, Jūrmalciems, Nīcas pagasts, Dienvidkurzemes
                        novads, LV-3473
                    </a>
                </p>

                <p>
                    <a href="tel:+37120510502">
                        <i className="fa-solid fa-phone"></i>&nbsp;&nbsp;+371 20
                        510 502
                    </a>
                </p>

                <p>
                    <a href="mailto:info@jekabi.com">
                        <i className="fa-solid fa-envelope"></i>
                        &nbsp;&nbsp;info@jekabi.com
                    </a>
                </p>
            </div>
            <div className="menu">
                <h2>Menu</h2>
                <ul>
                    <li>
                        <a href="/">Home</a>
                    </li>
                    <li>
                        <a href="/pricing">Pricing</a>
                    </li>
                    <li>
                        <a href="/about">About</a>
                    </li>
                    <li>
                        <a href="/contact">Contact</a>
                    </li>
                </ul>
            </div>
            <div className="Socials">
                <h2>Socials</h2>
                <ul>
                    <li>
                        <a href="https://www.facebook.com/jekabi">
                            <i className="fa-brands fa-facebook"></i>
                        </a>
                    </li>
                    <li>
                        <a href="https://www.instagram.com/jekabi/">
                            <i className="fa-brands fa-instagram"></i>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default Footer;
