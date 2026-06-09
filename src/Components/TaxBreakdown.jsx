import { useState } from "react";

function TaxBreakdown({
  totalPrice, gst, entertainmentTax,
  convBase, convGST, totalFees, grandTotal,
  selectedSeats, seatPricing, getSeatTier,
}) {
  const [openFees, setOpenFees] = useState(false);

  return (
    <div className="space-y-2">

      {/* Seat tier lines */}
      {["economy", "standard", "premium"].map((tier) => {
        const tierSeats = selectedSeats.filter(s => getSeatTier(s[0]) === tier);
        if (tierSeats.length === 0) return null;
        return (
          <div key={tier} className="flex justify-between text-sm">
            <span className="text-gray-400">
              {seatPricing[tier].label} × {tierSeats.length}
            </span>
            <span className="text-gray-300">
              ₹{tierSeats.length * seatPricing[tier].price}
            </span>
          </div>
        );
      })}

      {/* Convenience Fee dropdown */}
      <div>
            <button
          onClick={() => setOpenFees(p => !p)}
          className="w-full flex items-center justify-between py-1.5"
        >
          <div className="flex items-center gap-1.5">
            <svg
              className={`w-3.5 h-3.5 text-primary transition-transform duration-200 ${openFees ? "rotate-180" : "rotate-0"}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-sm text-gray-400">Convenience Fee</span>
          </div>
          <span className="text-sm text-gray-300" >₹{convBase + convGST + gst + entertainmentTax}</span>
        </button>

        {openFees && (
          <div className="mt-1 mb-2 space-y-1.5 pl-5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Base Amount (₹13 × {selectedSeats.length} seats)</span>
              <span>₹{convBase}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>IGST on Convenience Fee @ 18%</span>
              <span>₹{convGST}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>GST (IGST) @ 18% on tickets</span>
              <span>₹{gst}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Cinema Development Tax @ 2%</span>
              <span>₹{entertainmentTax}</span>
            </div>
          </div>
        )}
      </div>

      {/* Order Total */}
      <div className="border-t border-primary/20 pt-3 flex justify-between items-center">
        <span className="text-white font-bold">Order Total</span>
        <span className="text-white font-bold text-lg">₹{grandTotal}</span>
      </div>
      <p className="text-gray-600 text-xs text-right -mt-1">Incl. all taxes & fees</p>

    </div>
  );
}

export default TaxBreakdown;