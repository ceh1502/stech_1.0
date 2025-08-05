import {Outlet} from 'react-router-dom';

const GuestLayout = () => {
    return (
        <div className="guest-layout">
            <Outlet />
        </div>
    );
}

export default GuestLayout;