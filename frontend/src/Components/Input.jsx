export default function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-green-50 border border-green-200 text-green-900 placeholder-green-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${className}`}
    />
  );
}
