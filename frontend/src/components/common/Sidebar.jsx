import React from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { 
    DashboardOutlined, 
    ShopOutlined, 
    DatabaseOutlined,
    ShoppingCartOutlined,
    FileTextOutlined,
    AppstoreOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = () => {
    const location = useLocation();
    
    return (
        <Sider collapsible theme="light" width={230} style={{ borderRight: '1px solid #e0e0e0' }}>
            {/* Logo khu vực trên cùng */}
            <div style={{ 
                height: '56px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#005AAB',
                fontWeight: '800', 
                fontSize: '18px',
                borderBottom: '1px solid #f0f2f5',
                letterSpacing: '1px'
            }}>
                BÁCH HÓA STU
            </div>
            
            {/* Danh sách Menu */}
            <Menu 
                theme="light" 
                mode="inline" 
                selectedKeys={[location.pathname]}
                style={{ borderRight: 0, marginTop: '10px' }}
            >
                <Menu.Item key="/" icon={<DashboardOutlined style={{ fontSize: '16px' }} />}>
                    <Link to="/">Tổng quan</Link>
                </Menu.Item>

                <Menu.Item key="/products" icon={<ShopOutlined style={{ fontSize: '16px' }} />}>
                    <Link to="/products">Hàng hóa</Link>
                </Menu.Item>

                <Menu.Item key="/create-order" icon={<ShoppingCartOutlined style={{ fontSize: '16px' }} />}>
                    <Link to="/create-order">Bán hàng</Link>
                </Menu.Item>

                <Menu.Item key="/orders" icon={<FileTextOutlined style={{ fontSize: '16px' }} />}>
                    <Link to="/orders">Giao dịch</Link>
                </Menu.Item>

                <Menu.Item key="/warehouse-map" icon={<AppstoreOutlined style={{ fontSize: '16px' }} />}>
                    <Link to="/warehouse-map">Sơ đồ kho</Link>
                </Menu.Item>

                <Menu.Item key="/inventory" icon={<DatabaseOutlined style={{ fontSize: '16px' }} />}>
                    <Link to="/inventory">Quản lý kho</Link>
                </Menu.Item>
            </Menu>
        </Sider>
    );
};

export default Sidebar;