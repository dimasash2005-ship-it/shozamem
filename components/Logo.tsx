export default function Logo({ size = 18 }: { size?: number }) {
  return (
    <span className="logo" style={{ fontSize: size }} aria-label="SHO ZA MEM">
      <span aria-hidden="true">SHO</span>
      <span className="za" aria-hidden="true">za</span>
      <span className="mem" aria-hidden="true">MEM?!</span>
    </span>
  );
}
