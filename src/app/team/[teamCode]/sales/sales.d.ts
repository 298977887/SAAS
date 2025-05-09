/**
 * 销售记录相关的类型声明
 * 作者: 阿瑞
 * 功能: 提供销售记录相关组件的类型定义
 * 版本: 1.0.0
 */

/**
 * 已选产品列表组件属性
 */
declare module './components/SelectedProductList' {
  export interface SelectedProductProps {
    products: {
      productId: number;
      name: string;
      price: number;
      quantity: number;
      total: number;
    }[];
    onRemove: (index: number) => void;
  }
  
  const SelectedProductList: React.FC<SelectedProductProps>;
  export default SelectedProductList;
}
