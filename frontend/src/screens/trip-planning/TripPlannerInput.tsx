import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
  Modal,
  FlatList,
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  Minus,
  Plus,
  Search,
  DollarSign,
  IndianRupee,
  Edit2,
  X,
  MapPin,
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { fetchPlaceSuggestions } from '../../services/placesService';

export default function TripPlannerInput() {
  const navigation = useNavigation<any>();

  // Destination state
  const [destination, setDestination] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Date states - for display
  const [fromDate, setFromDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 8);
    return nextWeek.toISOString().split('T')[0];
  });
  
  // Temporary dates for calendar selection
  const [tempFromDate, setTempFromDate] = useState('');
  const [tempToDate, setTempToDate] = useState('');
  const [selectedRange, setSelectedRange] = useState({});
  
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'from' | 'to' | null>(null);

  const [travelers, setTravelers] = useState(3);
  const [budget, setBudget] = useState(150000);
  const [customBudget, setCustomBudget] = useState('150000');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isEditingCustom, setIsEditingCustom] = useState(false);

  const [interests, setInterests] = useState<string[]>([
    'History',
    'Adventure',
  ]);

  const MAX_BUDGET = 200000; // 2 lakh max for slider
  const SLIDER_MAX = 200000; // Max value for slider

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Select date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Handle opening calendar for specific date
  const openCalendarFor = (forDate: 'from' | 'to') => {
    setSelectingFor(forDate);
    
    // Set temporary dates to current display dates
    setTempFromDate(fromDate);
    setTempToDate(toDate);
    
    // Mark existing range if both dates exist
    if (fromDate && toDate) {
      const range = {};
      const start = new Date(fromDate);
      const end = new Date(toDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        range[dateStr] = {
          color: d.getTime() === start.getTime() ? '#2563EB' : 
                 d.getTime() === end.getTime() ? '#2563EB' : '#3B82F6',
          textColor: 'white',
          startingDay: d.getTime() === start.getTime(),
          endingDay: d.getTime() === end.getTime(),
        };
      }
      setSelectedRange(range);
    }
    
    setShowCalendar(true);
  };

  // Handle date selection in calendar
  const handleDateSelect = (day: any) => {
    const selectedDate = day.dateString;
    
    if (selectingFor === 'from') {
      setTempFromDate(selectedDate);
      
      // If tempToDate exists and selected date is after toDate, clear toDate
      if (tempToDate && selectedDate > tempToDate) {
        setTempToDate('');
      }
      
      // Update range visualization
      updateRangeVisualization(selectedDate, tempToDate);
      
    } else if (selectingFor === 'to') {
      setTempToDate(selectedDate);
      
      // If tempFromDate exists and selected date is before fromDate, clear fromDate
      if (tempFromDate && selectedDate < tempFromDate) {
        setTempFromDate('');
      }
      
      // Update range visualization
      updateRangeVisualization(tempFromDate, selectedDate);
    }
  };

  // Update range visualization
  const updateRangeVisualization = (startDateStr: string, endDateStr: string) => {
    if (!startDateStr || !endDateStr) {
      // If only one date is selected, show just that date
      const singleRange = {};
      if (startDateStr) {
        singleRange[startDateStr] = {
          startingDay: true,
          color: '#2563EB',
          textColor: 'white',
        };
      }
      if (endDateStr) {
        singleRange[endDateStr] = {
          endingDay: true,
          color: '#2563EB',
          textColor: 'white',
        };
      }
      setSelectedRange(singleRange);
      return;
    }
    
    // Make sure dates are in correct order
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    if (startDate > endDate) {
      // Swap dates if they're in wrong order
      const temp = startDateStr;
      startDateStr = endDateStr;
      endDateStr = temp;
      setTempFromDate(startDateStr);
      setTempToDate(endDateStr);
    }
    
    // Create range visualization
    const range = {};
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      range[dateStr] = {
        color: d.getTime() === start.getTime() ? '#2563EB' : 
               d.getTime() === end.getTime() ? '#2563EB' : '#3B82F6',
        textColor: 'white',
        startingDay: d.getTime() === start.getTime(),
        endingDay: d.getTime() === end.getTime(),
      };
    }
    
    setSelectedRange(range);
  };

  // Apply dates when "Apply Dates" is clicked
  const applyDates = () => {
    if (tempFromDate && tempToDate) {
      // Ensure dates are in correct order
      let finalFromDate = tempFromDate;
      let finalToDate = tempToDate;
      
      if (new Date(tempFromDate) > new Date(tempToDate)) {
        // Swap if from date is after to date
        finalFromDate = tempToDate;
        finalToDate = tempFromDate;
      }
      
      setFromDate(finalFromDate);
      setToDate(finalToDate);
      setShowCalendar(false);
      setSelectingFor(null);
    }
  };

  // Clear temporary date selection
  const clearTempDates = () => {
    setTempFromDate('');
    setTempToDate('');
    setSelectedRange({});
  };

  // Close calendar without applying
  const closeCalendar = () => {
    setShowCalendar(false);
    setSelectingFor(null);
    // Reset temporary dates to empty
    setTempFromDate('');
    setTempToDate('');
  };

  // Update custom input when slider changes
  useEffect(() => {
    if (!isEditingCustom) {
      const parsedCustom = parseInt(customBudget) || 0;
      if (parsedCustom <= MAX_BUDGET) {
        setCustomBudget(budget.toString());
      }
    }
  }, [budget, isEditingCustom, customBudget]);

  const handleCustomBudgetChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setCustomBudget(numericValue);
    
    if (numericValue) {
      const parsedValue = parseInt(numericValue) || 0;
      // Cap slider at MAX_BUDGET but keep custom amount
      const sliderValue = Math.min(parsedValue, MAX_BUDGET);
      setBudget(sliderValue);
    }
  };

  const handleCustomBudgetSubmit = () => {
    setIsEditingCustom(false);
    setShowCustomInput(false);
    if (!customBudget) {
      setCustomBudget(budget.toString());
    } else {
      const parsedValue = parseInt(customBudget) || 0;
      // Cap slider at MAX_BUDGET but keep custom amount
      const sliderValue = Math.min(parsedValue, MAX_BUDGET);
      setBudget(sliderValue);
      // Keep the full custom amount for display
    }
    Keyboard.dismiss();
  };

  const handleSliderChange = (value: number) => {
    setBudget(value);
    setCustomBudget(value.toString());
  };

  const toggleInterest = (item: string) => {
    setInterests(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item],
    );
  };

  const toggleCustomInput = () => {
    setShowCustomInput(!showCustomInput);
    if (!showCustomInput) {
      setIsEditingCustom(true);
    }
  };

  // Calculate display amount (either custom or slider)
  const getDisplayAmount = () => {
    const parsedCustom = parseInt(customBudget) || 0;
    return parsedCustom > 0 ? parsedCustom : budget;
  };

  const displayAmount = getDisplayAmount();

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan Your Trip</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* DESTINATION */}
        <Text style={styles.label}>Destination</Text>
        <View style={styles.inputBox}>
          <TextInput
            value={destination}
            onChangeText={async (text) => {
              setDestination(text);
              const results = await fetchPlaceSuggestions(text);
              setSuggestions(results);
              setShowSuggestions(true);
            }}
            placeholder="Enter destination"
            placeholderTextColor="#64748B"
            style={styles.inputText}
          />
          <Search color="#94A3B8" size={18} />
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    setDestination(item.name);
                    setShowSuggestions(false);
                    Keyboard.dismiss();
                  }}
                >
                  <MapPin size={16} color="#60A5FA" />
                  <Text style={styles.suggestionText}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* DATES */}
        <Text style={styles.label}>Dates</Text>
        
        <View style={styles.datesContainer}>
          {/* FROM DATE */}
          <TouchableOpacity
            style={[styles.dateInputBox, selectingFor === 'from' && styles.dateInputBoxActive]}
            onPress={() => openCalendarFor('from')}
          >
            <Calendar color="#94A3B8" size={18} />
            <View style={styles.dateInputContent}>
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>
                {formatDisplayDate(fromDate)}
              </Text>
            </View>
          </TouchableOpacity>

          {/* TO DATE */}
          <TouchableOpacity
            style={[styles.dateInputBox, selectingFor === 'to' && styles.dateInputBoxActive]}
            onPress={() => openCalendarFor('to')}
          >
            <Calendar color="#94A3B8" size={18} />
            <View style={styles.dateInputContent}>
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>
                {formatDisplayDate(toDate)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* TRAVELERS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Travelers</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setTravelers(Math.max(1, travelers - 1))}
            >
              <Minus color="#fff" size={16} />
            </TouchableOpacity>

            <Text style={styles.counterValue}>{travelers}</Text>

            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setTravelers(travelers + 1)}
            >
              <Plus color="#fff" size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* BUDGET */}
        <View style={styles.card}>
          <View style={styles.budgetHeader}>
            <Text style={styles.cardTitle}>
              Budget (per person)
            </Text>

            <View style={styles.budgetControls}>
              <TouchableOpacity
                style={styles.budgetPill}
                onPress={() =>
                  setCurrency(currency === 'INR' ? 'USD' : 'INR')
                }
              >
                {currency === 'INR' ? (
                  <IndianRupee color="#60A5FA" size={14} />
                ) : (
                  <DollarSign color="#60A5FA" size={14} />
                )}
                <Text style={styles.budgetValue}>
                  {currency === 'INR'
                    ? `₹${displayAmount.toLocaleString()}`
                    : `$${Math.round(displayAmount / 80)}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.customBudgetBtn, showCustomInput && styles.customBudgetBtnActive]}
                onPress={toggleCustomInput}
              >
                <Edit2 size={14} color={showCustomInput ? "#2563EB" : "#94A3B8"} />
                <Text style={[
                  styles.customBudgetBtnText,
                  showCustomInput && styles.customBudgetBtnTextActive
                ]}>
                  Custom
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showCustomInput ? (
            <View style={styles.customInputContainer}>
              <View style={styles.customInputWrapper}>
                <Text style={styles.currencyPrefix}>
                  {currency === 'INR' ? '₹' : '$'}
                </Text>
                <TextInput
                  style={styles.customInput}
                  value={customBudget}
                  onChangeText={handleCustomBudgetChange}
                  onFocus={() => setIsEditingCustom(true)}
                  onBlur={handleCustomBudgetSubmit}
                  onSubmitEditing={handleCustomBudgetSubmit}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor="#64748B"
                  autoFocus={true}
                />
              </View>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={handleCustomBudgetSubmit}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Slider
                minimumValue={0}
                maximumValue={SLIDER_MAX}
                step={1000}
                value={budget}
                onValueChange={handleSliderChange}
                minimumTrackTintColor="#2563EB"
                maximumTrackTintColor="#1F2933"
                thumbTintColor="#2563EB"
                style={{ marginTop: 12 }}
              />

              <View style={styles.sliderRange}>
                <Text style={styles.rangeText}>₹0</Text>
                <Text style={styles.rangeText}>
                  ₹2,00,000{parseInt(customBudget) > MAX_BUDGET ? '+' : ''}
                </Text>
              </View>

              {/* Show custom amount note if above slider max */}
              {parseInt(customBudget) > MAX_BUDGET && (
                <View style={styles.customAmountNote}>
                  <Text style={styles.customAmountNoteText}>
                    Custom amount set: ₹{parseInt(customBudget).toLocaleString()}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* INTERESTS */}
        <Text style={styles.label}>Interests</Text>

        <View style={styles.interestRow}>
          {['History', 'Food', 'Adventure'].map(i => (
            <Interest
              key={i}
              label={i}
              active={interests.includes(i)}
              onPress={() => toggleInterest(i)}
            />
          ))}
        </View>

        <View style={styles.interestRow}>
          {['Nature', 'Relaxation', 'Shopping'].map(i => (
            <Interest
              key={i}
              label={i}
              active={interests.includes(i)}
              onPress={() => toggleInterest(i)}
            />
          ))}
        </View>

        {/* GENERATE */}
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={() => {
            if (!fromDate || !toDate) {
              // Open calendar for from date if not selected
              if (!fromDate) {
                openCalendarFor('from');
              } else if (!toDate) {
                openCalendarFor('to');
              }
              return;
            }
            navigation.navigate('AIItineraryLoading', {
              destination,
              fromDate: formatDisplayDate(fromDate),
              toDate: formatDisplayDate(toDate),
              travelers,
              budget: parseInt(customBudget) || budget,
              currency,
              interests,
            })
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.generateText}>
            ✨ Generate Itinerary
          </Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FLOATING SOS */}
      <TouchableOpacity
        style={styles.sosButton}
        onPress={() => navigation.navigate('SOS')}
        activeOpacity={0.85}
      >
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>

      {/* CALENDAR MODAL */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                Select Dates
              </Text>
              <TouchableOpacity onPress={closeCalendar}>
                <X color="#fff" size={20} />
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <Text style={styles.calendarSubtitle}>
              {!tempFromDate ? 'Select start date' : 
               !tempToDate ? 'Select end date' : 
               'Both dates selected - Click "Apply Dates" to confirm'}
            </Text>

            {/* Calendar */}
            <RNCalendar
              minDate={new Date().toISOString().split('T')[0]}
              onDayPress={handleDateSelect}
              markedDates={selectedRange}
              markingType="period"
              theme={{
                backgroundColor: '#111827',
                calendarBackground: '#111827',
                textSectionTitleColor: '#94A3B8',
                selectedDayBackgroundColor: '#2563EB',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#60A5FA',
                dayTextColor: '#ffffff',
                textDisabledColor: '#4B5563',
                dotColor: '#2563EB',
                selectedDotColor: '#ffffff',
                arrowColor: '#60A5FA',
                monthTextColor: '#ffffff',
                textDayFontWeight: '400',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
              }}
              style={styles.calendar}
            />

            {/* Selected Dates */}
            <View style={styles.selectedDatesContainer}>
              <View style={[
                styles.selectedDateBox,
                selectingFor === 'from' && styles.selectedDateBoxActive
              ]}>
                <Text style={styles.selectedDateLabel}>From</Text>
                <Text style={styles.selectedDateValue}>
                  {tempFromDate ? formatDisplayDate(tempFromDate) : 'Not selected'}
                </Text>
              </View>
              <View style={[
                styles.selectedDateBox,
                selectingFor === 'to' && styles.selectedDateBoxActive
              ]}>
                <Text style={styles.selectedDateLabel}>To</Text>
                <Text style={styles.selectedDateValue}>
                  {tempToDate ? formatDisplayDate(tempToDate) : 'Not selected'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.calendarActions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearTempDates}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyButton, (!tempFromDate || !tempToDate) && styles.applyButtonDisabled]}
                onPress={applyDates}
                disabled={!tempFromDate || !tempToDate}
              >
                <Text style={styles.applyButtonText}>Apply Dates</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------- INTEREST CHIP ---------- */

function Interest({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.interestChip,
        active && styles.interestActive,
      ]}
    >
      <Text
        style={[
          styles.interestText,
          active && styles.interestTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B1220',
  },

  container: {
    paddingHorizontal: 16,
    paddingTop: 41,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  label: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 8,
    marginTop: 12,
  },

  // Destination Input
  inputBox: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
  },
  destinationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },

  // Date styles
  datesContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  dateInputBox: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInputBoxActive: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  dateInputContent: {
    flex: 1,
  },
  dateLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 2,
  },
  dateValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
  },
  cardTitle: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 12,
  },

  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F2933',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetPill: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  budgetValue: {
    color: '#60A5FA',
    fontWeight: '600',
    fontSize: 12,
  },

  customBudgetBtn: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#1F2933',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  customBudgetBtnActive: {
    backgroundColor: '#1E3A8A',
  },
  customBudgetBtnText: {
    color: '#94A3B8',
    fontWeight: '500',
    fontSize: 12,
  },
  customBudgetBtnTextActive: {
    color: '#60A5FA',
  },

  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  customInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2933',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  currencyPrefix: {
    color: '#60A5FA',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  customInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    height: '100%',
  },
  doneBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  doneBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  rangeText: {
    color: '#64748B',
    fontSize: 11,
  },

  customAmountNote: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    alignItems: 'center',
  },
  customAmountNoteText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '500',
  },

  interestRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  interestChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#111827',
  },
  interestActive: {
    backgroundColor: '#2563EB',
  },
  interestText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  interestTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  generateBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 26,
    alignItems: 'center',
  },
  generateText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  sosButton: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  sosText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  // Destination Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  destinationContainer: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  destinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  destinationTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2933',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  destinationList: {
    maxHeight: 400,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2933',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  destinationItemSelected: {
    backgroundColor: '#1E3A8A',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  destinationIcon: {
    fontSize: 24,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  destinationCountry: {
    color: '#94A3B8',
    fontSize: 12,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },

  // Calendar Styles
  calendarContainer: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  calendarSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  calendar: {
    borderRadius: 12,
    marginBottom: 20,
  },
  selectedDatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  selectedDateBox: {
    flex: 1,
    backgroundColor: '#1F2933',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  selectedDateBoxActive: {
    backgroundColor: '#1E3A8A',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  selectedDateLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  selectedDateValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarActions: {
    flexDirection: 'row',
    gap: 10,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#1F2933',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#1E293B',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  suggestionsBox: {
    backgroundColor: '#111827',
    borderRadius: 14,
    marginTop: 6,
    maxHeight: 200,
  },

  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2933',
  },

  suggestionText: {
    color: '#fff',
    fontSize: 14,
  },
});