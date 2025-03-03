import React, { useState } from "react";
import "./FAQ.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

function FAQSection() {
    const [activeIndex, setActiveIndex] = useState(null);

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const faqData = [
        {
            question: "Is the campsite pet-friendly?",
            answer: "Yes, we are a pet-friendly campsite! Please ensure your pets are kept on a leash and cleaned up after.",
            iconClass: "fa-solid fa-dog",
        },
        {
            question: "Do you provide firewood?",
            answer: "Yes, we provide firewood for purchase at the campsite. Each bag costs 5€ and contains 30L of firewood.",
            iconClass: "fa-solid fa-fire",
        },
        {
            question: "Is electricity available at the campsite?",
            answer: "Yes, electricity is available for an additional fee of 6€ per night.",
            iconClass: "fa-solid fa-bolt",
        },
        {
            question: "Can I bring my own tent or camper van?",
            answer: "Absolutely! You are welcome to bring your own tent or camper van. Please note that additional fees may apply for camper vans.",
            iconClass: "fa-solid fa-campground",
        },
        {
            question: "Are there shower facilities on-site?",
            answer: "Yes, we have modern shower facilities available 24/7 for your convenience. Outdoor showers are also available for an additional fee.",
            iconClass: "fa-solid fa-shower",
        },
        {
            question: "What is your cancellation policy?",
            answer: "Cancellations made at least 3 days before the check-in date will receive a full refund. Cancellations made within 3 days of check-in are non-refundable.",
            iconClass: "fa-solid fa-calendar-xmark",
        },
    ];

    return (
        <section className="faq-section">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-container">
                {faqData.map((faq, index) => (
                    <div
                        key={index}
                        className={`faq-item ${
                            activeIndex === index ? "active" : ""
                        }`}
                        onClick={() => toggleFAQ(index)}>
                        <div className="faq-question">
                            <span>
                                <i className={faq.iconClass}></i>
                                &nbsp;&nbsp;&nbsp;{faq.question}
                            </span>
                            <FontAwesomeIcon
                                icon={faChevronDown}
                                className={`chevron ${
                                    activeIndex === index ? "rotate" : ""
                                }`}
                            />
                        </div>

                        <div className="faq-answer">
                            <p>{faq.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default FAQSection;
