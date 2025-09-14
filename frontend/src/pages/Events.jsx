import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Users, Clock, DollarSign, ArrowRight } from 'lucide-react';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getEvents();
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to fetch events');
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventType = (event) => {
    if (event.isGroup) {
      return `Group Event (Max ${event.maxGroupSize} members)`;
    }
    return 'Individual Event';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          College Fest Events
        </h1>
        <p className="text-xl text-gray-600">
          Discover and register for exciting events at our college fest
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No events available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Check back later for upcoming events.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <div key={event._id} className="card hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                  {event.title}
                </h3>
                <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                  {getEventType(event)}
                </span>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-3">
                {event.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(event.dateTime)}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.venue}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Entry Fee: ₹{event.fee}
                </div>
                {event.packages && event.packages.length > 0 && (
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Packages available:</span>
                    <ul className="mt-1 space-y-1">
                      {event.packages.map((pkg, index) => (
                        <li key={index} className="text-xs">
                          • {pkg.name}: ₹{pkg.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {event.rules && event.rules.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Rules:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {event.rules.slice(0, 3).map((rule, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                    {event.rules.length > 3 && (
                      <li className="text-primary-600">
                        +{event.rules.length - 3} more rules
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <Link
                to={`/events/${event._id}`}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <span>View Details</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;

