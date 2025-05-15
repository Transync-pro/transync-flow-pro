
const LocationMap = () => {
  return (
    <div className="rounded-xl overflow-hidden shadow-lg h-96">
      <iframe
        title="TransyncPro Office Location"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3168.641413969206!2d-120.47885722393851!3d37.30407164332388!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80914293f9d64591%3A0x7b0e31fab777adf9!2s3075%20Park%20Ave%2C%20Merced%2C%20CA%2095348!5e0!3m2!1sen!2sus!4v1684440319819!5m2!1sen!2sus"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen={true}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>
  );
};

export default LocationMap;
