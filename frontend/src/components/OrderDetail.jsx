import { motion } from 'framer-motion';
import { Button, Divider } from 'antd';

export default function OrderDetail({ order, onClose }) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 h-full w-2/3 bg-white shadow-2xl overflow-auto z-50"
    >
      <div className="p-6">
        <Button onClick={onClose}>← Đóng</Button>
        <h2 className="text-2xl mt-4">Đơn hàng #{order.order_code}</h2>
        {/* Thêm chi tiết + danh sách sản phẩm */}
      </div>
    </motion.div>
  );
}