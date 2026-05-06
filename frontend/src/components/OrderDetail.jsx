import { motion } from 'framer-motion';
import { Button, Divider, Table, Tag } from 'antd';
import dayjs from 'dayjs';

export default function OrderDetail({ order, onClose }) {
  const columns = [
    { title: 'Sản phẩm', dataIndex: 'product_name', key: 'product_name' },
    { title: 'SL', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: 'Đơn giá', dataIndex: 'unit_price', key: 'unit_price', width: 140, render: (v) => Number(v || 0).toLocaleString('vi-VN') + ' ₫' },
    { title: 'Thành tiền', dataIndex: 'subtotal', key: 'subtotal', width: 160, render: (v) => <strong>{Number(v || 0).toLocaleString('vi-VN')} ₫</strong> },
  ];

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
        <div className="mt-3 text-gray-600">
          <div>Thời gian: {dayjs(order.created_at).format('DD/MM/YYYY HH:mm:ss')}</div>
          <div>Khách hàng: {order.customer_name || 'Khách lẻ'}</div>
          <div>Người bán: {order.seller || '-'}</div>
          <div className="mt-2">
            Trạng thái:{' '}
            <Tag color={order.status === 'completed' ? 'green' : 'orange'}>
              {order.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
            </Tag>
          </div>
        </div>

        <Divider />

        <Table
          columns={columns}
          dataSource={order.items || []}
          rowKey={(row, idx) => `${row.product_id}-${idx}`}
          pagination={false}
          size="small"
        />

        <Divider />

        <div className="flex flex-col gap-2 text-right">
          <div>Tổng tiền: <strong>{Number(order.total_amount || 0).toLocaleString('vi-VN')} ₫</strong></div>
          <div>Giảm giá: <strong>{Number(order.discount || 0).toLocaleString('vi-VN')} ₫</strong></div>
          <div className="text-lg">Thanh toán: <strong>{Number(order.final_amount || 0).toLocaleString('vi-VN')} ₫</strong></div>
        </div>
      </div>
    </motion.div>
  );
}