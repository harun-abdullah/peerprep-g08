import { useState } from "react";
import { useNavigate } from "react-router";

export default function GenerateOTP() {
  const [otp, setOtp] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  const handleGenerate = async () => {
    setMessage("");
    setError(false);
    setOtp(null);

    const token = localStorage.getItem("token");

    if (!token) {
      setError(true);
      setMessage("You must be logged in.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_USER_API_URL}/users/admin-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate OTP.");
      }

      setOtp(data.data.code);
      setMessage("Admin code generated successfully!");
    } catch (error: any) {
      console.error("Error:", error);
      setError(true);
      setMessage(error.message || "Something went wrong");
    }
  };

  return (
    <div className="container">
      <div className="box">
        <h3>Generate Admin OTP</h3>

        <button
          className="button"
          onClick={handleGenerate}
          style={{ backgroundColor: "#52de92" }}
        >
          Generate Code
        </button>

        {otp && (
          <div>
            <p>Your Admin Code:</p>
            <h1>{otp}</h1>
          </div>
        )}

        {message && !otp && (
          <p
            style={{
              color: error ? "red" : "green",
            }}
          >
            {message}
          </p>
        )}

        <button
          className="button"
          onClick={handleBack}
          style={{ backgroundColor: "#c41e1e" }}
        >
          Back
        </button>
      </div>
    </div>
  );
}
