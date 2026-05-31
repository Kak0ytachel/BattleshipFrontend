import { useRef, useState, type ChangeEvent, type KeyboardEvent, type ClipboardEvent } from "react";
import "./OtpInput.css";

interface OtpInputProps {
    length?: number;
    onComplete?:  null | ((code: string) => void);
}

export default function OtpInput ({ length = 6, onComplete = null }: OtpInputProps) {
    // array to hold the values of each input box
    const [values, setValues] = useState<string[]>(Array(length).fill(""));

    // array of references to access individual input DOM elements
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    // Helper to sync state changes and check if the code is complete
    const handleStateChange = (newValues: string[]) => {
        setValues(newValues);
        const combinedCode = newValues.join("");

        if (combinedCode.length === length && onComplete) {
            onComplete(combinedCode);
        }
    };

    // handles typing and auto-advancing
    const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value.replace(/[^0-9A-Za-z]/g, "").toUpperCase(); // Allow digits and letters
        if (!val) return;


        const newValues = [...values];
        // Take only the last character if multiple are entered somehow
        newValues[index] = val.substring(val.length - 1);
        handleStateChange(newValues);

        // auto-advance focus to the next box
        if (index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // handles backspace and backward navigation
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace") {
            const newValues = [...values];

            if (values[index] !== "") {
                // Clear current box if it has a value
                newValues[index] = "";
                handleStateChange(newValues);
            } else if (index > 0) {
                // if current box is already empty, clear the previous box and focus on it
                newValues[index - 1] = "";
                handleStateChange(newValues);
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    // handle pasting an entire code into the inputs
    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim().replace(/[^0-9]/g, "");

        const newValues = [...values];
        const pastedChars = pastedData.split("").slice(0, length);

        pastedChars.forEach((char, i) => {
            newValues[i] = char;
        });

        handleStateChange(newValues);

        // Focus the next empty box or the last box
        const focusIndex = Math.min(pastedChars.length, length - 1);
        inputRefs.current[focusIndex]?.focus();
    };

    return (
        <div className="code-container">
            {values.map((value, index) => (
                <input
                    key={index}
                    type="text"
                    ref={(el) => { inputRefs.current[index] = el; }}
                    value={value}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    maxLength={1}
                    inputMode="text"
                    pattern="[0-9]*"
                    className="code-input"
                />
            ))}
        </div>
    );
};