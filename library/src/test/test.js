import createSounding from '../sounding';
//import StatsTable from '../draw';
import data from './soundingData.json'; // assert { type: 'json' };

function getSounding() {
    const sounding = createSounding();
    sounding.updateData(data, '1753707600000');
    return sounding;
}

export { getSounding };
