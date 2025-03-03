import React from "react";
import "./Contact.css";
import { useNavigate } from "react-router-dom";

function ContactPage() {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Thank you for contacting us! We'll get back to you soon.");
    };

    return (
        <div className="contactPage">
            {/* Hero Section */}
            <section className="contactHero">
                <div className="heroContent">
                    <h1>Contact Us</h1>
                    <p>
                        We'd love to hear from you! Whether you have a question,
                        feedback, or just want to say hello, feel free to reach
                        out.
                    </p>
                </div>
            </section>

            {/* Contact Form and Details Section */}
            <section className="contactMain">
                <div className="contactForm">
                    <h2>Send Us a Message</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="formGroup">
                            <label htmlFor="name">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Enter your name"
                                required
                            />
                        </div>
                        <div className="formGroup">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <div className="formGroup">
                            <label htmlFor="message">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                placeholder="Enter your message"
                                rows="5"
                                required
                            ></textarea>
                        </div>
                        <button type="submit">Send Message</button>
                    </form>
                </div>

                <div className="contactDetails">
                    <h2>Contact Information</h2>
                    <div className="detailsCard">
                        <h3>Address</h3>
                        <p>
                            Jēkabi, Jūrmalciems, Nīcas pagasts, Dienvidkurzemes
                            novads, LV-3473
                        </p>
                    </div>
                    <div className="detailsCard">
                        <h3>Phone</h3>
                        <p>+371 20 510 502</p>
                    </div>
                    <div className="detailsCard">
                        <h3>Email</h3>
                        <p>info@jekabi.com</p>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="contactMap">
                <iframe
                    title="Jūrmalciems Camping Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2212.7483300187732!2d20.98174507620335!3d56.316916548401586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46fab15cb806a1cd%3A0x31848bcf252beba7!2sCamping%20Jurmalciems%20Jekabi!5e0!3m2!1sen!2slv!4v1739277767273!5m2!1sen!2slv"
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
            </section>
        </div>
    );
}

export default ContactPage;
