import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiInfo, FiSquare } from "react-icons/fi";
import {
  FaBed,
  FaBath,
  FaCouch,
  FaCar,
  FaRulerHorizontal,
  FaVectorSquare,
} from "react-icons/fa6";
import "./App.css";

type RawPropertyRecord = {
  Area: string;
  Lot: string;
  Estate: string;
  Suburb: string;
  Status: string;
  HomeDesign: string;
  Width: string;
  Depth: string;
  Orientation: string;
  LandSize: string;
  HouseSize: string;
  BuildPrice: string;
  LandPrice: string;
  TotalPrice: string;
  RantalAppraisal: string;
  RentalYield: string;
  TitleStatus: string;
  Storey: string;
  Beds: string;
  Baths: string;
  Cars: string;
  Living: string;
};

type PropertyRecord = {
  Area: string;
  Lot: string;
  Estate: string;
  Suburb: string;
  Status: string;
  HomeDesign: string;
  Width: number;
  Depth: number;
  Orientation: string;
  LandSize: number;
  HouseSize: number;
  BuildPrice: number;
  LandPrice: number;
  TotalPrice: number;
  RantalAppraisal: number;
  RentalYield: number;
  TitleStatus: string;
  Storey: string;
  Beds: number;
  Baths: number;
  Cars: number;
  Living: number;
};

type SortType = "alphabetical" | "price-low-high" | "price-high-low";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-AU", {
  maximumFractionDigits: 2,
});

const toNumber = (value: string) => {
  const parsed = Number.parseFloat(String(value).replace(/[^0-9.]/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeProperty = (item: RawPropertyRecord): PropertyRecord => ({
  Area: item.Area,
  Lot: item.Lot,
  Estate: item.Estate,
  Suburb: item.Suburb,
  Status: item.Status,
  HomeDesign: item.HomeDesign,
  Width: toNumber(item.Width),
  Depth: toNumber(item.Depth),
  Orientation: item.Orientation,
  LandSize: toNumber(item.LandSize),
  HouseSize: toNumber(item.HouseSize),
  BuildPrice: toNumber(item.BuildPrice),
  LandPrice: toNumber(item.LandPrice),
  TotalPrice: toNumber(item.TotalPrice),
  RantalAppraisal: toNumber(item.RantalAppraisal),
  RentalYield: toNumber(item.RentalYield),
  TitleStatus: item.TitleStatus,
  Storey: item.Storey,
  Beds: toNumber(item.Beds),
  Baths: toNumber(item.Baths),
  Cars: toNumber(item.Cars),
  Living: toNumber(item.Living),
});

function App() {
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyRecord | null>(null);
  const [locationMode, setLocationMode] = useState<"suburbs" | "estates">(
    "suburbs"
  );
  const [locationQuery, setLocationQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("Any region");
  const [storeyFilter, setStoreyFilter] = useState("Any");
  const [bedsFilter, setBedsFilter] = useState("Any");
  const [statusFilter, setStatusFilter] = useState("Any");
  const [sortBy, setSortBy] = useState<SortType>("alphabetical");

  useEffect(() => {
    const loadProperties = async () => {
      const response = await fetch("/data/data.json");
      const data = (await response.json()) as RawPropertyRecord[];
      setProperties(data.map(normalizeProperty));
    };

    loadProperties().catch(() => setProperties([]));
  }, []);

  const areas = useMemo(
    () => ["Any region", ...new Set(properties.map(item => item.Area))],
    [properties]
  );

  const storeyOptions = useMemo(
    () => ["Any", ...new Set(properties.map(item => item.Storey))],
    [properties]
  );

  const bedsOptions = useMemo(
    () => [
      "Any",
      ...new Set(properties.map(item => String(item.Beds))).values(),
    ],
    [properties]
  );

  const statusOptions = useMemo(
    () => ["Any", ...new Set(properties.map(item => item.Status))],
    [properties]
  );

  const filteredProperties = useMemo(() => {
    const normalizedQuery = locationQuery.trim().toLowerCase();

    const filtered = properties.filter(item => {
      const locationTarget =
        locationMode === "suburbs" ? item.Suburb : item.Estate;
      const locationMatch =
        normalizedQuery.length === 0 ||
        locationTarget.toLowerCase().includes(normalizedQuery);

      const areaMatch = areaFilter === "Any region" || item.Area === areaFilter;
      const storeyMatch =
        storeyFilter === "Any" || item.Storey === storeyFilter;
      const bedsMatch =
        bedsFilter === "Any" || String(item.Beds) === bedsFilter;
      const statusMatch =
        statusFilter === "Any" ||
        item.Status.toLowerCase() === statusFilter.toLowerCase();

      return (
        locationMatch && areaMatch && storeyMatch && bedsMatch && statusMatch
      );
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === "alphabetical") return a.Suburb.localeCompare(b.Suburb);
      if (sortBy === "price-low-high") return a.TotalPrice - b.TotalPrice;
      return b.TotalPrice - a.TotalPrice;
    });

    return sorted;
  }, [
    areaFilter,
    bedsFilter,
    locationMode,
    locationQuery,
    properties,
    sortBy,
    statusFilter,
    storeyFilter,
  ]);

  const clearFilters = () => {
    setLocationMode("suburbs");
    setLocationQuery("");
    setAreaFilter("Any region");
    setStoreyFilter("Any");
    setBedsFilter("Any");
    setStatusFilter("Any");
    setSortBy("alphabetical");
  };

  const formatModalValue = (key: string, value: string | number) => {
    if (typeof value === "number") {
      if (key === "RentalYield") return `${numberFormatter.format(value)}%`;
      if (key.includes("Price")) return currencyFormatter.format(value);
      return numberFormatter.format(value);
    }
    return value;
  };

  return (
    <main className="app-shell">
      <header className="page-header">
        <h1>House &amp; Land Packages in Melbourne</h1>
      </header>

      <section className="filter-strip" aria-label="Property filters">
        <div className="filter-tabs" role="tablist" aria-label="Search by">
          <button
            type="button"
            role="tab"
            className={locationMode === "suburbs" ? "tab active" : "tab"}
            aria-selected={locationMode === "suburbs"}
            onClick={() => setLocationMode("suburbs")}
          >
            Suburbs
          </button>
          <button
            type="button"
            role="tab"
            className={locationMode === "estates" ? "tab active" : "tab"}
            aria-selected={locationMode === "estates"}
            onClick={() => setLocationMode("estates")}
          >
            Estates
          </button>
        </div>

        <label className="search-field" htmlFor="location-query">
          <span className="filter-label">Location</span>
          <span className="search-input-wrap">
            <input
              id="location-query"
              value={locationQuery}
              onChange={event => setLocationQuery(event.target.value)}
              placeholder="Suburb, postcode or estate"
            />
            <FiSearch className="search-icon" aria-hidden="true" />
          </span>
        </label>

        <label className="select-field" htmlFor="region-filter">
          <span className="filter-label">Region</span>
          <select
            id="region-filter"
            value={areaFilter}
            onChange={event => setAreaFilter(event.target.value)}
          >
            {areas.map(area => (
              <option value={area} key={area}>
                {area}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field" htmlFor="storey-filter">
          <span className="filter-label">Storeys</span>
          <select
            id="storey-filter"
            value={storeyFilter}
            onChange={event => setStoreyFilter(event.target.value)}
          >
            {storeyOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field" htmlFor="beds-filter">
          <span className="filter-label">Beds</span>
          <select
            id="beds-filter"
            value={bedsFilter}
            onChange={event => setBedsFilter(event.target.value)}
          >
            {bedsOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field" htmlFor="status-filter">
          <span className="filter-label">Status</span>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field" htmlFor="sort-by">
          <span className="filter-label">Sort by</span>
          <select
            id="sort-by"
            value={sortBy}
            onChange={event => setSortBy(event.target.value as SortType)}
          >
            <option value="alphabetical">Alphabetical</option>
            <option value="price-low-high">Price: low to high</option>
            <option value="price-high-low">Price: high to low</option>
          </select>
        </label>

        <button type="button" className="clear-button" onClick={clearFilters}>
          Reset
        </button>
      </section>

      <section className="results-grid" aria-live="polite">
        {filteredProperties.map(property => (
          <article
            className="property-card"
            key={`${property.Lot}-${property.HomeDesign}`}
            onClick={() => setSelectedProperty(property)}
            role="button"
            tabIndex={0}
            onKeyDown={event => {
              if (event.key === "Enter" || event.key === " ") {
                setSelectedProperty(property);
              }
            }}
            aria-label={`Open details for ${property.HomeDesign}`}
          >
            <header className="property-card-head">
              <h2>{property.HomeDesign}</h2>
              <span className="compare-link">
                <FiSquare aria-hidden="true" />
                Compare
              </span>
            </header>

            <p className="price-line">
              Fixed price package{" "}
              <strong>{currencyFormatter.format(property.TotalPrice)}*</strong>
            </p>

            <p className="location-line">
              {property.Suburb} ({property.Estate})
              <br />
              Lot {property.Lot}
            </p>

            <p className="title-status">
              {property.TitleStatus}{" "}
              <FiInfo className="inline-info" aria-hidden="true" />
            </p>

            <div className="detail-icons">
              <span title="Beds">
                <FaBed /> {property.Beds}
              </span>
              <span title="Baths">
                <FaBath /> {property.Baths}
              </span>
              <span title="Living">
                <FaCouch /> {property.Living}
              </span>
              <span title="Cars">
                <FaCar /> {property.Cars}
              </span>
              <span title="Width">
                <FaRulerHorizontal /> {property.Width}m
              </span>
              <span title="Land size">
                <FaVectorSquare /> {property.LandSize}m²
              </span>
            </div>
          </article>
        ))}

        {filteredProperties.length === 0 && (
          <article className="property-card empty-state">
            <h2>No matching packages</h2>
            <p>Try changing filters or clearing the current search.</p>
          </article>
        )}
      </section>

      {selectedProperty !== null && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setSelectedProperty(null)}
        >
          <section
            className="details-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Property details"
            onClick={event => event.stopPropagation()}
          >
            <header className="modal-header">
              <h3>{selectedProperty.HomeDesign}</h3>
              <button
                type="button"
                className="close-modal"
                onClick={() => setSelectedProperty(null)}
              >
                Close
              </button>
            </header>

            <div className="modal-grid">
              {Object.entries(selectedProperty).map(([key, value]) => (
                <div className="modal-row" key={key}>
                  <span>{key}</span>
                  <strong>{formatModalValue(key, value)}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
