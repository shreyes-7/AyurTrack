export default function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-gray-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${className}`}
    />
  );
}
