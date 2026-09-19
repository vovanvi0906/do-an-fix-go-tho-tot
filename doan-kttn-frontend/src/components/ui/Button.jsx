export default function Button({ children, ...props }) {
  return <button {...props}>{children || 'Button'}</button>;
}
