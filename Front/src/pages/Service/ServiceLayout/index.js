import { Link, Outlet } from 'react-router-dom';

const ServiceLayout = () => {
  return ( 
    <div>
      <nav>
        <Link to='/service'>Home</Link>
        <Link to='/service/clip'>Clip</Link>
        <Link to='/service/data'>Data</Link>
        <Link to='/service/login'>Login</Link>
      </nav>
      <Outlet />
    </div>
  )
}

export default ServiceLayout;