import "./OtpInput.css";

interface OtpInputProps {
    length?: number;
    onComplete?:  null | ((code: string) => void);
    value_?: string;
}

export default function OtpOutput ({ length = 6, value_ = "123456" }: OtpInputProps) {

    const values_: string[] = value_.toUpperCase().split("").slice(0, length);

    return (
        <div className="code-container">
            {values_.map((value, index) => (
                <input
                    key={index}
                    type="text"
                    // ref={(el) => { inputRefs.current[index] = el; }}
                    value={value}
                    maxLength={1}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="code-input"
                    disabled={true}
                />
            ))}
        </div>
    );
};