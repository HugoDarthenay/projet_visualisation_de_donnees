import Geocode from './geocode.js';

export default class GeoService {
    baseUrl = 'http://localhost:8081/geocode?q=';

    async getGeocodeByCity(city) {
        try {
            const res = await fetch(this.baseUrl + encodeURIComponent(city));
            
            if (!res.ok) return null;

            const data = await res.json();
            
            if (!data || data.length === 0) return null;

            return new Geocode(data[0].lat, data[0].lon, data[0].display_name);
        } catch (err) {
            console.error('GeoService : ', err);
            return null;
        }
    }
}
