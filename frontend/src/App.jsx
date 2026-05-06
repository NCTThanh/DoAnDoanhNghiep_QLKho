import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Avatar, Badge } from 'antd';
import { BellOutlined, UserOutlined, ShopOutlined } from '@ant-design/icons';
import Sidebar from './components/common/Sidebar';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import CreateOrderPage from './pages/CreateOrderPage';
import Products from './pages/Products'; 
import WarehouseMap from './pages/WarehouseMap';
// Thêm import cho các pages mới
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import CreatePurchaseOrder from './pages/CreatePurchaseOrder';
import ReceivePurchaseOrder from './pages/ReceivePurchaseOrder';
import ReturnPurchaseOrder from './pages/ReturnPurchaseOrder';
import InventoryHistory from './pages/InventoryHistory';
function App() {
  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-[#f0f2f5]">
        {/* Thanh Menu bên trái */}
        <Sidebar />
        
        {/* Khu vực nội dung bên phải */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Top Header - Chuẩn phong cách KiotViet */}
          <header className="h-14 bg-[#005AAB] text-white flex items-center justify-between px-6 shadow-md z-10">
            <div className="flex items-center gap-2">
               <ShopOutlined className="text-xl" />
               <span className="font-semibold text-sm tracking-wide">Chi nhánh trung tâm (STU)</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Badge count={2} size="small">
                <BellOutlined className="text-xl text-white cursor-pointer hover:text-gray-200 transition-colors" />
              </Badge>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-blue-700 px-3 py-1 rounded transition-colors">
                <Avatar size="small" icon={<UserOutlined />} className="bg-white/20" />
                <span className="font-medium text-sm">Nguyễn Chí Thanh</span>
              </div>
            </div>
          </header>

          {/* Khu vực thay đổi trang (Pages) */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/create-order" element={<CreateOrderPage />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/warehouse-map" element={<WarehouseMap />} />
              
              {/* Routes mới */}
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/create-purchase-order" element={<CreatePurchaseOrder />} />
              <Route path="/receive-purchase-order/:id" element={<ReceivePurchaseOrder />} />
              <Route path="/return-purchase-order/:id" element={<ReturnPurchaseOrder />} />
              <Route path="/inventory-history" element={<InventoryHistory />} />
            </Routes>
          </main>
          
        </div>
      </div>
    </Router>
  );
}

export default App;