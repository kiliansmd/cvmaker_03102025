import type React from "react"

// This component is used to declare dependencies for the project
// It doesn't render anything, but ensures the required packages are available

const PackageDependencies: React.FC = () => {
  return null
}

// Declare the dependencies we need
const dependencies = {
  "lucide-react": "^0.263.1",
  next: "^13.4.0",
  react: "^18.2.0",
  "react-dom": "^18.2.0",
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  typescript: "^5.0.0",
  tailwindcss: "^3.3.0",
  autoprefixer: "^10.4.14",
  postcss: "^8.4.24",
}

export default PackageDependencies
