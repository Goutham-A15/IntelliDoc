"use client"
import { useState } from "react";
import { HistoryList } from "@/components/history/history-list";
import { HistoryDetailsModal } from "@/components/history/HistoryDetailsModal";
import { History } from "lucide-react";
import { motion } from "framer-motion"; // Import framer-motion

type HistoryItem = {
  id: string;
  created_at: string;
  document_names?: string[];
  results?: any;
  related_document_ids?: string[];
};


export default function HistoryPage() {
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleHistorySelect = (job: HistoryItem) => {
    setSelectedHistoryItem(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedHistoryItem(null);
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-6xl"
    >
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <History className="h-8 w-8" /> Analysis History
      </h1>
      <p className="text-muted-foreground mb-8">
        Review and reopen the results of your past document comparisons.
      </p>
      <HistoryList onHistorySelect={handleHistorySelect} />
      <HistoryDetailsModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        historyItem={selectedHistoryItem}
      />
    </motion.div>
  );
}