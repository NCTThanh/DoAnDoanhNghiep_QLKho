import { useRef } from 'react';
import { Button, Modal } from 'antd';
import { useReactToPrint } from 'react-to-print';
import { PrinterOutlined } from '@ant-design/icons'; // Thêm dòng import này

const InvoicePrint = ({ order, onClose }) => {
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `HoaDon_${order.order_code}`,
  });

  return (
    <Modal open={true} footer={null} width={400} onCancel={onClose} centered>
      <div ref={printRef} className="p-6 font-mono text-sm">
        <h2 className="text-center text-xl font-bold mb-4">BẠCH HÓA STORE</h2>
        <p className="text-center">Quảng Trị • 1800 6522</p>
        <hr className="my-3" />
        
        <p>Mã đơn: <b>{order.order_code}</b></p>
        <p>Ngày: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
        
        <table className="w-full mt-4">
          <thead>
            <tr className="border-b">
              <th className="text-left">Hàng</th>
              <th className="text-center">SL</th>
              <th className="text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b">
                <td>{item.name}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">
                  {(item.selling_price * item.quantity).toLocaleString()} ₫
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 text-right font-bold">
          Tổng: {order.final_amount.toLocaleString()} ₫
        </div>
        <p className="text-center text-xs mt-6">Cảm ơn quý khách!</p>
      </div>

      <Button type="primary" block onClick={handlePrint} className="mt-4">
        <PrinterOutlined /> In hóa đơn
      </Button>
    </Modal>
  );
};

export default InvoicePrint;