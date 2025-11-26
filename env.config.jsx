import { DIRECT_PLUGIN, PLUGIN_OPERATIONS } from "@openedx/frontend-plugin-framework";
import React, { useState, useEffect } from "react";
import { LearningHeader as Header } from "@edx/frontend-component-header";

// Cookie utilities
const setCookie = (name, value, days) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;domain=${window.location.hostname}`;
};

const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

// Custom Header với Dark Mode
const CustomLearningHeader = ({ courseOrg, courseNumber, courseTitle, showUserDropdown }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = getCookie("theme");
        const prefersDark = savedTheme === "dark";
        setIsDarkMode(prefersDark);
        applyTheme(prefersDark);
    }, []);

    const applyTheme = (isDark) => {
        if (isDark) {
            document.documentElement.classList.add("dark-theme");
            document.documentElement.setAttribute("data-theme", "dark");
            document.body.classList.add("dark-theme");
        } else {
            document.documentElement.classList.remove("dark-theme");
            document.documentElement.setAttribute("data-theme", "light");
            document.body.classList.remove("dark-theme");
        }
    };

    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        setCookie("theme", newTheme ? "dark" : "light", 365);
        applyTheme(newTheme);
    };

    return (
        <div style={{ position: "relative" }}>
            {/* Header gốc */}
            <Header
                courseOrg={courseOrg}
                courseNumber={courseNumber}
                courseTitle={courseTitle}
                showUserDropdown={showUserDropdown}
            />

            {/* Dark mode toggle */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    right: "80px",
                    transform: "translateY(-50%)",
                    zIndex: 1000,
                }}
            >
                <button
                    onClick={toggleTheme}
                    style={{
                        padding: "8px 16px",
                        border: "none",
                        borderRadius: "20px",
                        cursor: "pointer",
                        fontSize: "16px",
                        background: isDarkMode ? "#374151" : "#e5e7eb",
                        color: isDarkMode ? "#fff" : "#1f2937",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontWeight: "500",
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                    }}
                    aria-label="Toggle dark mode"
                    title={isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
                >
                    {isDarkMode ? "🌙" : "☀️"}
                    <span style={{ fontSize: "13px" }}>{isDarkMode ? "Tối" : "Sáng"}</span>
                </button>
            </div>
        </div>
    );
};

const config = {
    pluginSlots: {
        "org.openedx.frontend.layout.header_learning.v1": {
            keepDefault: false,
            plugins: [
                {
                    op: PLUGIN_OPERATIONS.Insert,
                    widget: {
                        id: "custom_header_with_darkmode",
                        type: DIRECT_PLUGIN,
                        RenderWidget: CustomLearningHeader,
                    },
                },
            ],
        },
    },
};

export default config;
