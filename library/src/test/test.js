import Sounding from '../sounding';
import data from './soundingData.json'; // assert { type: 'json' };

function displayResults() {
    const sounding = new Sounding();
    sounding.updateData(data, '1753707600000');
    console.log(sounding.members);
    console.log(sounding.profileData);
    const stats = sounding.sharpStats(sounding.profileData[0]);
    console.log(stats);
}

function getSounding() {
    const sounding = new Sounding();
    sounding.updateData(data, '1753707600000');
    return sounding;
}

export default getSounding;
