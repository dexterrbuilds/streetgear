import React from 'react';
import { Link } from 'react-router-dom';
import gta from '../assets/images/gta.png'
import '../App.css'

function Homepage() {
  return (
    <div className="home">
      <img src={gta} className='gtaImg'/>
      <div>
        <Link to="/driveby">
          <button className='navbtn'>senderr</button>
        </Link>
      </div>
    </div>
  );
}

export default Homepage;
