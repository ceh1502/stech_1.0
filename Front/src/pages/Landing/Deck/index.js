import React from 'react';
import Header from '../LandingHome/Header';
import Footer from '../LandingHome/Footer';
import './deck.css';
import TeamLogo from '../../../assets/images/png/TeamPng/teamLogo.png';
import StechDeck from '../../../assets/images/png/DeckPng/StechDeck.png';

const Deck = () => {
    return (
        <div className="deckContainer">
            <Header style={{ zIndex: '2' }} />
            <div className="deckheader">
                <div className="decklogoandtitle">
                    <img src={TeamLogo} alt="Stech Logo" className="deckheaderlogo" />
                    <h1 className="decktitle">IR Deck</h1>
                </div>
            </div>
            <div className="deckmain">
                <img src={StechDeck} alt="Stech IR Deck Main" className="deckmainimage" />
            </div>
            <div className="deckmessage">
                <p>
                    context
                </p>
            </div>

            <Footer/>
        </div>
    );
};

export default Deck;