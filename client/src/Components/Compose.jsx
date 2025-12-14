// client/src/Components/Compose.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPost } from "../Features/postSlice";
import { getMyLocation, reverseGeocodeOSM } from "../utils/geo";

export default function Compose() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  const [loc, setLoc] = useState(null);
  const [locName, setLocName] = useState("");          // label full
  const [locDetails, setLocDetails] = useState(null);  // object full
  const [locLoading, setLocLoading] = useState(false);

  const user = useSelector((s) => s.users.user);
  const dispatch = useDispatch();

  const pickLocation = async () => {
    try {
      setLocLoading(true);

      const { lat, lng, accuracy } = await getMyLocation();
      setLoc({ lat, lng, accuracy });

      const { details, label } = await reverseGeocodeOSM(lat, lng);
      setLocName(label || details.displayName || "My location");
      setLocDetails(details);
    } catch (e) {
      alert("Location permission denied or unavailable.");
    } finally {
      setLocLoading(false);
    }
  };

  const clearLocation = () => {
    setLoc(null);
    setLocName("");
    setLocDetails(null);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!user?._id) return alert("login first");

    const hasText = !!text.trim();
    const hasFile = !!file;
    if (!hasText && !hasFile) {
      return alert("Write something or choose an image before posting.");
    }

    dispatch(
      createPost({
        authorId: user._id,
        text,
        file,
        lat: loc?.lat,
        lng: loc?.lng,
        locationName: locName,
        locationDetails: locDetails,
      })
    );

    setText("");
    setFile(null);
    clearLocation();
  };

  return (
    <div className="page">
      <div className="stack">
        <div className="page-head">
          <h2 className="h-title">Compose</h2>
          <p className="h-sub">Write something and publish it.</p>
        </div>

        <form className="card card-soft stack" onSubmit={submit}>
          <div className="field">
            <div className="label">Post text</div>
            <textarea
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's new?"
            />
          </div>

          <div className="field">
            <div className="label">Image (optional)</div>
            <input
              className="file-input"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="field">
            <div className="label">Location (auto)</div>

            <div className="row wrap">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={pickLocation}
                disabled={locLoading}
              >
                {locLoading ? "Detecting..." : "Use my location"}
              </button>

              {loc && (
                <button className="btn btn-danger" type="button" onClick={clearLocation}>
                  Remove
                </button>
              )}
            </div>

            {loc && (
              <div className="stack" style={{ gap: 8 }}>
                <input
                  className="input"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="Auto location details"
                />

                <div className="h-sub">
                  Accuracy: {Math.round(loc.accuracy || 0)}m — lat {loc.lat.toFixed(5)} , lng{" "}
                  {loc.lng.toFixed(5)}
                </div>

                {locDetails && (
                  <div className="card card-soft" style={{ padding: 12 }}>
                    <div className="label">Detected details</div>
                    <div className="h-sub">
                      Country: {locDetails.country} ({locDetails.countryCode})
                    </div>
                    <div className="h-sub">State/Governorate: {locDetails.state}</div>
                    <div className="h-sub">City: {locDetails.city}</div>
                    <div className="h-sub">Suburb: {locDetails.suburb}</div>
                    <div className="h-sub">Road: {locDetails.road}</div>
                    <div className="h-sub">Postcode: {locDetails.postcode}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="btn btn-primary btn-block" type="submit">
            Post
          </button>
        </form>
      </div>
    </div>
  );
}
