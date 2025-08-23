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
            <Route index element={<LandingPages.LandingPage />} />
            <Route path="Team" element={<LandingPages.Team />} />
            <Route path="Deck" element={<LandingPages.Deck />} />
            <Route path="Contact" element={<LandingPages.Contact />} />

            {/* Service Pages */}
            <Route path="/service" element={<ServicePages.ServiceLayout />}>
                <Route index element={<ServicePages.ServiceHome />} />
                <Route path="game" element={<ServicePages.GameLayout />} >
                    <Route index element={<ServicePages.GamePage />} />
                    <Route path=":gameKey/clip" element={<ServicePages.ClipPage />} />
                </Route>
                <Route path="stat" element={<ServicePages.StatLayout />} >
                    <Route index element={<ServicePages.LeaguePage />} />
                    <Route path="league" element={<ServicePages.LeaguePage />} />
                    <Route path="team" element={<ServicePages.LeagueTeamPage />} />
                    <Route path="position" element={<ServicePages.LeaguePositionPage />} />
                </Route>
                <Route path="highlight" element={<ServicePages.HighlightPage />} />
                <Route path='suggestion' element={<ServicePages.SuggestionPage />} />
                <Route path="support" element={<ServicePages.SupportPage />} />
                <Route path="faq" element={<ServicePages.FAQPage />} />
                <Route path="profile" element={<ServicePages.ProfileLayout />} >
                    <Route index element={<ServicePages.ProfilePage />} />
                    <Route path="teamplayer" element={<ServicePages.ProfileTeamPlayer />} />
                    <Route path="modify" element={<ServicePages.ProfileModify />} />
                    <Route path="clip" element={<ServicePages.ProfileClip />} />
                    <Route path="manage" element={<ServicePages.ProfileManage />} />
                </Route>
                <Route path="settings" element={<ServicePages.SettingsPage />} />

                {/* Guest Pages */}
                <Route path="guest" element={<ServicePages.GuestLayout />}>
                    <Route index element={<ServicePages.GuestHomePage />} />
                    <Route path="game" element={<ServicePages.GuestGamePage />} />
                    <Route path="clip" element={<ServicePages.GuestClipPage />} />
                    <Route path="stat" element={<ServicePages.GuestStatLayout />} >
                        <Route index element={<ServicePages.GuestLeaguePage />} />
                        <Route path='league' element={<ServicePages.GuestLeaguePage />} />
                        <Route path="team" element={<ServicePages.GuestLeagueTeamPage />} />
                        <Route path="position" element={<ServicePages.GuestLeaguePositionPage />} />
                    </Route>
                </Route>
            </Route>

            {/* Auth Pages*/}
            <Route path="auth" element={<AuthPages.AuthLayout />}>
                <Route index element={<AuthPages.LoginPage />} />
                <Route path="signup" element={<AuthPages.SignupPage />} />
                <Route path="signupprofile" element={<AuthPages.SignupProfilePage />} />
                <Route path="find" element={<AuthPages.FindPage />} />
                <Route path="findcode" element={<AuthPages.FindCodePage />} />
                <Route path="changepassword" element={<AuthPages.ChangePasswordPage />} />
                <Route path="findsuccess" element={<AuthPages.FindSuccessPage />} />
                <Route path="verify-email" element={<AuthPages.VerifyEmailPage />} />
            </Route>
            {/* 404 Not Found */}
            <Route path="json" element={<CommonPages.JsonEx />} />
            <Route path="*" element={<CommonPages.NotFoundPage />} />
        </Routes>
    );
}
