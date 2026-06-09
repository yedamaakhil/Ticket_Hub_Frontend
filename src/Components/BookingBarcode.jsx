function BookingBarcode({ value = "" }) {
  // Deterministic "hash" so same bookingId always gives same barcode
  const seed = value.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const pseudoRand = (index) => {
    const x = Math.sin(seed * 9301 + index * 49297 + 233) * 803826;
    return x - Math.floor(x);
  };

  // Build bar sequence: narrow (1) or wide (2 or 3) bars + spaces
  const bars = [];

  // Left guard
  bars.push({ w: 2, bar: true });
  bars.push({ w: 1, bar: false });
  bars.push({ w: 2, bar: true });
  bars.push({ w: 2, bar: false });

  // Encode each char of the bookingId
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    for (let b = 3; b >= 0; b--) {
      const bit = (code >> b) & 1;
      const extra = pseudoRand(i * 8 + b) > 0.7 ? 1 : 0;
      bars.push({ w: bit ? 3 + extra : 1,     bar: true  });
      bars.push({ w: bit ? 1         : 2,     bar: false });
    }
  }

  // Right guard
  bars.push({ w: 2, bar: false });
  bars.push({ w: 2, bar: true  });
  bars.push({ w: 1, bar: false });
  bars.push({ w: 3, bar: true  });

  // Build SVG paths
  let x = 0;
  const rects = [];
  bars.forEach((bar, i) => {
    if (bar.bar) {
      rects.push(
        <rect key={i} x={x} y={0} width={bar.w} height={60} fill="white" />
      );
    }
    x += bar.w;
  });

  const totalWidth = bars.reduce((sum, b) => sum + b.w, 0);

  return (
    <div className="bg-white rounded-lg px-4 py-3 inline-block">
      <svg
        width={Math.min(totalWidth * 1.4, 240)}
        height={60}
        viewBox={`0 0 ${totalWidth} 60`}
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        <rect x={0} y={0} width={totalWidth} height={60} fill="black" />
        {rects}
      </svg>
    </div>
  );
}
export default BookingBarcode;