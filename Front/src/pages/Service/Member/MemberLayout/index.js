import {Outlet} from 'react-router-dom';

const MemberLayout = () => {
    return (
        <div className="member-layout">
            <Outlet />
        </div>
    );
}

export default MemberLayout;