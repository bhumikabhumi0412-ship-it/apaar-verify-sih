export default function StatCard({ label, value, tone = "blue" }) {
  const tones = {
    blue: "text-blue-700",
    green: "text-green-700",
    amber: "text-amber-600",
    red: "text-red-700",
  };
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${tones[tone] || tones.blue}`}>{value}</p>
    </div>
  );
}
