import { Routes, Route } from 'react-router-dom';

import * as LandingPages from '../pages/Landing';
import * as ServicePages from '../pages/Service';
import * as AuthPages from '../pages/Auth';
import * as CommonPages from '../pages/Common';

export default function AppRouter() {
    return (
        <Routes>
            {/* Landing Pages */}
            <Route path="/" element={<LandingPages.LandingLayout />} />
            <Route path="/team" element={<LandingPages.TeamPage />} />

            {/* Service Pages */}
            <Route path="/service" element={<ServicePages.ServiceLayout />}>
                <Route index element={<ServicePages.ServiceHome />} />
                <Route path="clip" element={<ServicePages.ClipPage />} />
                <Route path="game" element={<ServicePages.GamePage />} />
                <Route path="stat" element={<ServicePages.StatLayout />} >
                    <Route index element={<ServicePages.LeagueTeamPage />} />
                    <Route path="team" element={<ServicePages.LeagueTeamPage />} />
                    <Route path="position" element={<ServicePages.LeaguePositionPage />} />
                </Route>
                <Route path="highlight" element={<ServicePages.HighlightPage />} />
                <Route path='suggestion' element={<ServicePages.SuggestionPage />} />
                <Route path="support" element={<ServicePages.SupportPage />} />
                <Route path="faq" element={<ServicePages.FAQPage />} />
                <Route path="profile" element={<ServicePages.ProfilePage />} />
                <Route path="settings" element={<ServicePages.SettingsPage />} />
                <Route path="guest" element={<ServicePages.GuestLayout />}>
                    <Route index element={<ServicePages.GuestHomePage />} />
                    <Route path="game" element={<ServicePages.GuestGamePage />} />
                    <Route path="clip" element={<ServicePages.GuestClipPage />} />
                    <Route path="stat" element={<ServicePages.GuestStatPage />} />
                </Route>
            </Route>

            {/* Auth Pages*/}
            <Route path="auth" element={<AuthPages.AuthLayout />}>
                <Route index element={<AuthPages.LoginPage />} />
                <Route path="signup" element={<AuthPages.SignupPage />} />
                <Route path="find" element={<AuthPages.FindPage />} />
                <Route path="verify-email" element={<AuthPages.VerifyEmailPage />} />
            </Route>
            {/* 404 Not Found */}
            <Route path="*" element={<CommonPages.NotFoundPage />} />
        </Routes>
    );
}
