import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Popconfirm,
  message,
  DatePicker,
  Upload,
  Image,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const { Option } = Select;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const API_URL = "http://localhost:5000/api/products";
  const SERVER_URL = "http://localhost:5000";

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Không thể tải dữ liệu hàng hóa",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    setCategories([
      { id: 1, name: "Nước giải khát" },
      { id: 2, name: "Sữa" },
      { id: 3, name: "Bánh kẹo" },
      { id: 4, name: "Gia vị" },
      { id: 5, name: "Đồ dùng cá nhân" },
    ]);
    setLocations([
      { id: 1, name: "Khu A - Kệ 1" },
      { id: 2, name: "Khu A - Kệ 2" },
    ]);
  };

  useEffect(() => {
    fetchProducts();
    fetchDropdownData();
  }, []);

  const showModal = (record = null) => {
    setEditingProduct(record);
    setFileList([]);

    if (record) {
      form.setFieldsValue({
        ...record,
        mfg_date: record.mfg_date ? dayjs(record.mfg_date) : null,
        exp_date: record.exp_date ? dayjs(record.exp_date) : null,
      });
      if (record.image) {
        setFileList([
          {
            uid: "-1",
            name: "image.png",
            status: "done",
            url: record.image.startsWith('http') ? record.image : `${SERVER_URL}${record.image}`,          },
        ]);
      }
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      // Chuẩn hóa payload: luôn cung cấp các trường mà backend mong đợi.
      const keys = [
        "name",
        "barcode",
        "selling_price",
        "cost_price",
        "category_id",
        "unit",
        "discount_percent",
        "location_id",
        "quantity",
        "mfg_date",
        "exp_date",
      ];
      const payload = {};
      keys.forEach((key) => {
        let v = values[key];
        if (key === "mfg_date" || key === "exp_date") {
          v = v ? v.format("YYYY-MM-DD") : null;
        }
        // Nếu undefined thì đặt null để backend không nhận undefined (gây lỗi bind)
        if (v === undefined) v = null;
        payload[key] = v;
      });

      // Nếu có file, gửi multipart/form-data. Khi gửi FormData, chuyển null thành chuỗi 'null'
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const formData = new FormData();
        Object.keys(payload).forEach((k) => {
          formData.append(k, payload[k] === null ? "null" : payload[k]);
        });
        formData.append("image", fileList[0].originFileObj);

        if (editingProduct) {
          await axios.put(`${API_URL}/${editingProduct.id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          message.success("Cập nhật sản phẩm thành công!");
        } else {
          await axios.post(API_URL, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          message.success("Thêm sản phẩm mới thành công!");
        }
      } else {
        // Không có file: gửi JSON với giá trị null thực sự
        if (editingProduct) {
          await axios.put(`${API_URL}/${editingProduct.id}`, payload, {
            headers: { "Content-Type": "application/json" },
          });
          message.success("Cập nhật sản phẩm thành công!");
        } else {
          await axios.post(API_URL, payload, {
            headers: { "Content-Type": "application/json" },
          });
          message.success("Thêm sản phẩm mới thành công!");
        }
      }

      setIsModalVisible(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || "Có lỗi xảy ra khi lưu!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      message.success("Xóa sản phẩm thành công!");
      fetchProducts();
    } catch (error) {
      message.error(error?.response?.data?.message || "Lỗi khi xóa sản phẩm!");
    }
  };

  const onChangeUpload = ({ fileList: newFileList }) =>
    setFileList(newFileList);

  const columns = [
    {
      title: "Hình ảnh",
      dataIndex: "image",
      key: "image",
      render: (text) => {
        if (!text) return "No Img";
        // Build URL: for external images route via backend proxy to avoid CORS/hotlink issues
        const imageUrl = text.startsWith('http')
          ? `${SERVER_URL}/api/proxy-image?url=${encodeURIComponent(text)}`
          : `${SERVER_URL}${text.startsWith('/') ? text : '/' + text}`;
        // fallback tiny placeholder
        const fallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="100%" height="100%" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%23999">No Img</text></svg>';
        return (
          <img
            src={imageUrl}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallback; }}
            alt="product"
            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
          />
        );
      },
    },
    { title: "Mã vạch", dataIndex: "barcode", key: "barcode" },
    { title: "Tên hàng", dataIndex: "name", key: "name", width: 200 },
    { title: "Danh mục", dataIndex: "category_name", key: "category_name" },
    { title: "ĐVT", dataIndex: "unit", key: "unit" },
    {
      title: "Giá bán",
      dataIndex: "selling_price",
      key: "selling_price",
      render: (val) => (val ? `${Number(val).toLocaleString()} đ` : "0 đ"),
    },
    { title: "Tồn kho", dataIndex: "quantity", key: "quantity" },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            ghost
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#fff", minHeight: "80vh" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2>Quản lý hàng hóa</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          Thêm hàng hóa
        </Button>
      </div>

      <Table
        dataSource={products}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingProduct ? "Sửa thông tin hàng hóa" : "Thêm hàng hóa mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        okText="Lưu lại"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item
              name="name"
              label="Tên hàng"
              rules={[{ required: true }]}
              style={{ flex: 2 }}
            >
              <Input placeholder="VD: Nước ngọt Coca Cola" />
            </Form.Item>
            <Form.Item
              name="barcode"
              label="Mã vạch (Barcode)"
              style={{ flex: 1 }}
            >
              <Input placeholder="VD: 893456..." />
            </Form.Item>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            {/* Đã thêm allowClear để cho phép bỏ trống Danh mục nếu bị lỗi ID */}
            <Form.Item name="category_id" label="Danh mục" style={{ flex: 1 }}>
              <Select placeholder="Chọn danh mục" allowClear>
                {categories.map((cat) => (
                  <Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="unit"
              label="Đơn vị tính"
              initialValue="cái"
              style={{ flex: 1 }}
            >
              <Select>
                <Option value="cái">Cái</Option>
                <Option value="chai">Chai</Option>
                <Option value="thùng">Thùng</Option>
                <Option value="lốc">Lốc</Option>
                <Option value="kg">Kg</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="discount_percent"
              label="% Giảm giá"
              initialValue={0}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} max={100} style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item
              name="cost_price"
              label="Giá vốn (Giá nhập)"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="selling_price"
              label="Giá bán"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <fieldset
            style={{
              border: "1px solid #d9d9d9",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
            <legend
              style={{ padding: "0 8px", color: "#1890ff", fontWeight: 500 }}
            >
              Thông tin Tồn kho & Vị trí
            </legend>
            <div style={{ display: "flex", gap: 16 }}>
              <Form.Item
                name="quantity"
                label="Số lượng tồn"
                initialValue={0}
                style={{ flex: 1 }}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  disabled={!!editingProduct}
                />
              </Form.Item>
              <Form.Item
                name="location_id"
                label="Vị trí kho"
                style={{ flex: 1 }}
              >
                <Select placeholder="Chọn vị trí" allowClear>
                  {locations.map((loc) => (
                    <Option key={loc.id} value={loc.id}>
                      {loc.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <Form.Item
                name="mfg_date"
                label="Ngày sản xuất"
                style={{ flex: 1 }}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name="exp_date"
                label="Hạn sử dụng"
                style={{ flex: 1 }}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </div>
          </fieldset>

          <Form.Item label="Hình ảnh sản phẩm">
            <Upload
              listType="picture"
              maxCount={1}
              fileList={fileList}
              onChange={onChangeUpload}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
