"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const SECRET_PIN = "1947";

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [pin, setPin] = useState("");
  const [prevValue, setPrevValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const navigate = useCallback(() => router.push("/dashboard"), [router]);

  const handleNumber = (num: string) => {
    const newPin = pin + num;
    setPin(newPin);
    if (newPin.endsWith(SECRET_PIN)) {
      navigate();
      return;
    }
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    setPin("");
    const current = parseFloat(display);
    if (prevValue !== null && operator && !waitingForOperand) {
      const result = calculate(parseFloat(prevValue), current, operator);
      setDisplay(String(result));
      setPrevValue(String(result));
    } else {
      setPrevValue(display);
    }
    setOperator(op);
    setWaitingForOperand(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEquals = () => {
    setPin("");
    if (prevValue !== null && operator) {
      const result = calculate(parseFloat(prevValue), parseFloat(display), operator);
      setDisplay(String(parseFloat(result.toFixed(10))));
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setPin("");
  };

  const handleDecimal = () => {
    if (!display.includes(".")) setDisplay(display + ".");
  };

  const handleToggleSign = () => setDisplay(String(parseFloat(display) * -1));
  const handlePercent = () => setDisplay(String(parseFloat(display) / 100));

  const onEqualLongPressStart = () => {
    longPressTimer.current = setTimeout(() => navigate(), 1500);
  };
  const onEqualLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const btnBase = "flex items-center justify-center rounded-full text-xl font-medium h-16 w-16 transition-all duration-150 active:scale-95 select-none";

  return (
    <div className="flex flex-col items-center justify-end min-h-screen bg-black pb-8 px-4">
      {/* Display */}
      <div className="w-full max-w-xs mb-4 text-right px-2">
        <p className="text-gray-500 text-sm h-5">{prevValue && operator ? `${prevValue} ${operator}` : ""}</p>
        <p className="text-white text-5xl font-light truncate">{display}</p>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-xs">
        {/* Row 1 */}
        <button onClick={handleClear} className={`${btnBase} bg-gray-400 text-black`}>{display !== "0" ? "C" : "AC"}</button>
        <button onClick={handleToggleSign} className={`${btnBase} bg-gray-400 text-black`}>+/-</button>
        <button onClick={handlePercent} className={`${btnBase} bg-gray-400 text-black`}>%</button>
        <button onClick={() => handleOperator("÷")} className={`${btnBase} ${operator === "÷" ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}>÷</button>

        {/* Row 2 */}
        {["7","8","9"].map(n => <button key={n} onClick={() => handleNumber(n)} className={`${btnBase} bg-gray-800 text-white`}>{n}</button>)}
        <button onClick={() => handleOperator("×")} className={`${btnBase} ${operator === "×" ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}>×</button>

        {/* Row 3 */}
        {["4","5","6"].map(n => <button key={n} onClick={() => handleNumber(n)} className={`${btnBase} bg-gray-800 text-white`}>{n}</button>)}
        <button onClick={() => handleOperator("-")} className={`${btnBase} ${operator === "-" ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}>−</button>

        {/* Row 4 */}
        {["1","2","3"].map(n => <button key={n} onClick={() => handleNumber(n)} className={`${btnBase} bg-gray-800 text-white`}>{n}</button>)}
        <button onClick={() => handleOperator("+")} className={`${btnBase} ${operator === "+" ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}>+</button>

        {/* Row 5 */}
        <button onClick={() => handleNumber("0")} className={`${btnBase} bg-gray-800 text-white col-span-2 w-full rounded-full px-6 justify-start`}>0</button>
        <button onClick={handleDecimal} className={`${btnBase} bg-gray-800 text-white`}>.</button>
        <button
          onClick={handleEquals}
          onMouseDown={onEqualLongPressStart}
          onMouseUp={onEqualLongPressEnd}
          onTouchStart={onEqualLongPressStart}
          onTouchEnd={onEqualLongPressEnd}
          className={`${btnBase} bg-orange-500 text-white`}
        >=</button>
      </div>

      <p className="text-gray-800 text-xs mt-6">Calculator v2.1</p>
    </div>
  );
}
