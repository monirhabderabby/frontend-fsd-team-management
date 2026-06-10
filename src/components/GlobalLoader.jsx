const GlobalLoader = ({ label = "Loading..." }) => {
    return (
        <div className="global-loader" role="status" aria-live="polite">
            <div className="global-loader-spinner" aria-hidden="true" />
            <div className="global-loader-text">{label}</div>
        </div>
    );
};

export default GlobalLoader;
