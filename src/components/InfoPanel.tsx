import React from "react";
import styles from "../app/page.module.css";

export interface InfoPanelProps {
    feature: {
        properties: {
            name: string;
            full_address: string;
            place_formatted: string;
            context: {
                neighborhood?: { name: string };
                locality?:     { name: string };
                region?:       { name: string };
                country?:      { name: string };
            };
        };
    };
}

export default function InfoPanel({ feature }: InfoPanelProps) {
    const {
        name,
        full_address,
        place_formatted,
        context,
    } = feature.properties;

    return (
        <div className={styles.infoContent}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.85)',
                padding: '16px',
                borderRadius: '8px'
            }}>
                {/* Title */}
                <h3 style={{
                    margin: '0 0 8px',
                    color: '#111',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                }}>{name}</h3>
                <p style={{
                    margin: '0 0 12px',
                    color: '#333',
                    fontSize: '.9rem',
                }}>{place_formatted}</p>

                {/* Divider */}
                <hr style={{
                    border: 'none',
                    borderTop: '1px solid #ddd',
                    margin: '8px 0'
                }} />

                {/* Context list */}
                <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    color: '#444',
                    fontSize: '0.85rem',
                    lineHeight: 1.4
                }}>
                    {context.neighborhood && (
                        <li><strong>Neighborhood:</strong> {context.neighborhood.name}</li>
                    )}
                    {context.locality && (
                        <li><strong>Locality:</strong> {context.locality.name}</li>
                    )}
                    {context.region && (
                        <li><strong>Region:</strong> {context.region.name}</li>
                    )}
                    {context.country && (
                        <li><strong>Country:</strong> {context.country.name}</li>
                    )}
                </ul>
            </div>
        </div>
    );
}