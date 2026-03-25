import React from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { DashboardOutlined, ShopOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = () => {
    const location = useLocation();
    
    return (
        <Sider collapsible theme="dark">
            <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                QLBH - STU
            </div>
            <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]}>
                <Menu.Item key="/" icon={<DashboardOutlined />}>
                    <Link to="/">Tổng quan</Link>
                </Menu.Item>
                <Menu.Item key="/products" icon={<ShopOutlined />}>
                    <Link to="/products">Hàng hóa</Link>
                </Menu.Item>
                <Menu.Item key="/inventory" icon={<DatabaseOutlined />}>
                    <Link to="/inventory">Giao dịch kho</Link>
                </Menu.Item>
            </Menu>
        </Sider>
    );
};

export default Sidebar;