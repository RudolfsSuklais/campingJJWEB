import React from "react";
import "./About.css";
import { useNavigate } from "react-router-dom";

function AboutPage() {
    const navigate = useNavigate();

    const handleBookNow = () => {
        navigate("/booking");
    };

    return (
        <div className="aboutPage">
            {/* Hero Section */}
            <section className="aboutHero">
                <div className="heroContent">
                    <h1>About Jūrmalciems Camping</h1>
                    <p>
                        Discover the story behind our passion for nature and
                        hospitality.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="aboutMission">
                <div className="missionContent">
                    <h2>Our Mission</h2>
                    <p>
                        At Jūrmalciems Camping, we strive to provide a serene
                        and eco-friendly retreat where guests can reconnect with
                        nature. Our mission is to create unforgettable
                        experiences while preserving the beauty of the Baltic
                        Sea coastline.
                    </p>
                </div>
            </section>

            {/* Sustainability Section */}
            <section className="aboutSustainability">
                <div className="sustainabilityContent">
                    <h2>Sustainability at Jūrmalciems</h2>
                    <p>
                        We are committed to protecting the environment and
                        promoting sustainable tourism. Our campsite is powered
                        by renewable energy, and we actively participate in
                        local conservation efforts. From eco-friendly
                        accommodations to waste reduction initiatives, we ensure
                        that every aspect of your stay aligns with our green
                        values.
                    </p>
                    <div className="sustainabilityFeatures">
                        <div className="featureCard">
                            <h3>Renewable Energy</h3>
                            <p>
                                Our campsite is powered by solar panels and wind
                                turbines, reducing our carbon footprint.
                            </p>
                        </div>
                        <div className="featureCard">
                            <h3>Waste Reduction</h3>
                            <p>
                                We have implemented a zero-waste policy, with
                                recycling and composting facilities available
                                throughout the site.
                            </p>
                        </div>
                        <div className="featureCard">
                            <h3>Local Conservation</h3>
                            <p>
                                We partner with local organizations to protect
                                the Baltic Sea coastline and its wildlife.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call-to-Action Section */}
            <section className="aboutCTA">
                <h2>Join Us for an Unforgettable Experience</h2>
                <p>
                    Book your stay today and immerse yourself in the beauty of
                    nature.
                </p>
                <button onClick={handleBookNow}>Book Now</button>
            </section>
        </div>
    );
}

export default AboutPage;
