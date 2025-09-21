import React from "react";
import Layout from "../Components/Layout";
import Card from "../Components/Card";
import { motion } from "framer-motion";
import { Leaf, Package, Clock, Activity } from "lucide-react";

export default function Dashboard() {
  const cols = JSON.parse(
    localStorage.getItem("ayurtrace:collections") || "[]"
  );
  const batches = JSON.parse(
    localStorage.getItem("ayurtrace:processing") || "[]"
  );
  const queue = JSON.parse(localStorage.getItem("ayurtrace:queue") || "[]");

  const stats = [
    {
      label: "Collections",
      value: cols.length,
      icon: <Leaf className="w-6 h-6 text-green-400" />,
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Batches",
      value: batches.length,
      icon: <Package className="w-6 h-6 text-blue-400" />,
      color: "from-blue-500 to-indigo-600",
    },
    {
      label: "Queued",
      value: queue.length,
      icon: <Clock className="w-6 h-6 text-yellow-400" />,
      color: "from-yellow-500 to-orange-500",
    },
  ];

  return (
    <Layout>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
          >
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">{s.label}</div>
                  <div className="text-3xl font-bold text-white mt-1">
                    {s.value}
                  </div>
                </div>
                <div
                  className={`p-3 rounded-xl bg-gradient-to-r ${s.color} bg-opacity-20`}
                >
                  {s.icon}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Collections & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Collections */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card title="Latest Collections">
            {cols.length === 0 ? (
              <div className="text-gray-500 text-sm">
                No collection events yet.
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-300">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="py-2">Species</th>
                    <th className="py-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {cols.slice(0, 6).map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-gray-800 hover:bg-gray-800/40 transition"
                    >
                      <td className="py-2">{c.species}</td>
                      <td className="py-2">
                        {new Date(c.ts).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card title="System Health">
            <div className="text-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Ledger</span>
                <span className="font-medium text-green-400">Mock</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">TX Latency</span>
                <span className="font-medium">~600ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">System Status</span>
                <span className="flex items-center gap-2 text-green-400">
                  <Activity className="w-4 h-4 animate-pulse" />
                  Healthy
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
