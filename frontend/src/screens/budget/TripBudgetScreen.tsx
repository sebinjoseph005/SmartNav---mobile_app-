import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

interface Participant {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitWith: string[];
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export default function TripBudgetScreen() {
  const navigation = useNavigation();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [participantName, setParticipantName] = useState("");
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Expense form state
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [selectedPayer, setSelectedPayer] = useState("");
  const [splitType, setSplitType] = useState<"everyone" | "self" | "custom">("everyone");
  const [selectedSplitters, setSelectedSplitters] = useState<string[]>([]);

  /* ---------------- ADD PARTICIPANT ---------------- */

  const addParticipant = () => {
    if (!participantName.trim()) {
      Alert.alert("Enter a name");
      return;
    }

    const newP: Participant = {
      id: Date.now().toString(),
      name: participantName.trim(),
    };

    setParticipants([...participants, newP]);
    setParticipantName("");
  };

  /* ---------------- ADD EXPENSE ---------------- */

  const addExpense = () => {
    const amount = parseFloat(expenseAmount);

    if (!expenseDesc.trim()) return Alert.alert("Error", "Enter description");
    if (!amount || amount <= 0) return Alert.alert("Error", "Enter valid amount");
    if (!selectedPayer) return Alert.alert("Error", "Select who paid");

    let splitPeople: string[] = [];
    
    if (splitType === "everyone") {
      splitPeople = participants.map(p => p.id);
    } else if (splitType === "self") {
      splitPeople = [selectedPayer];
    } else {
      // custom
      if (selectedSplitters.length === 0) {
        return Alert.alert("Error", "Select who to split with");
      }
      splitPeople = selectedSplitters;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      description: expenseDesc.trim(),
      amount,
      paidBy: selectedPayer,
      splitWith: splitPeople,
    };

    setExpenses([...expenses, newExpense]);

    // Reset
    setExpenseDesc("");
    setExpenseAmount("");
    setSelectedPayer("");
    setSplitType("everyone");
    setSelectedSplitters([]);
    setShowExpenseModal(false);
  };

  /* ---------------- HELPERS ---------------- */

  const getName = (id: string) =>
    participants.find((p) => p.id === id)?.name || "Unknown";

  const removeExpense = (id: string) => {
    Alert.alert("Delete Expense", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setExpenses(expenses.filter((e) => e.id !== id)),
      },
    ]);
  };

  const removeParticipant = (id: string) => {
    // Check if participant is used in any expense
    const usedInExpense = expenses.some(
      (e) => e.paidBy === id || e.splitWith.includes(id)
    );

    if (usedInExpense) {
      Alert.alert(
        "Cannot Remove",
        "This person is used in one or more expenses. Delete those expenses first."
      );
      return;
    }

    Alert.alert("Remove Participant", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setParticipants(participants.filter((p) => p.id !== id)),
      },
    ]);
  };

  const closeModal = () => {
    setShowExpenseModal(false);
    setExpenseDesc("");
    setExpenseAmount("");
    setSelectedPayer("");
    setSplitType("everyone");
    setSelectedSplitters([]);
  };

  /* ---------------- BALANCE CALCULATION ---------------- */

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const balances = useMemo(() => {
    const bal: Record<string, number> = {};
    participants.forEach((p) => (bal[p.id] = 0));

    expenses.forEach((expense) => {
      const sharePerPerson = expense.amount / expense.splitWith.length;

      // The person who paid gets the full amount as credit
      bal[expense.paidBy] = (bal[expense.paidBy] || 0) + expense.amount;

      // Each person in the split owes their share
      expense.splitWith.forEach((id) => {
        bal[id] = (bal[id] || 0) - sharePerPerson;
      });
    });

    return bal;
  }, [participants, expenses]);

  const settlements = useMemo(() => {
    const balCopy = { ...balances };
    const settlements: Settlement[] = [];

    const creditors = Object.entries(balCopy)
      .filter(([_, v]) => v > 0.01)
      .sort((a, b) => b[1] - a[1]);

    const debtors = Object.entries(balCopy)
      .filter(([_, v]) => v < -0.01)
      .sort((a, b) => a[1] - b[1]);

    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
      const [creditorId, creditAmount] = creditors[i];
      const [debtorId, debtAmount] = debtors[j];

      const settleAmount = Math.min(creditAmount, Math.abs(debtAmount));

      if (settleAmount > 0.01) {
        settlements.push({
          from: debtorId,
          to: creditorId,
          amount: settleAmount,
        });
      }

      creditors[i][1] -= settleAmount;
      debtors[j][1] += settleAmount;

      if (Math.abs(creditors[i][1]) < 0.01) i++;
      if (Math.abs(debtors[j][1]) < 0.01) j++;
    }

    return settlements;
  }, [balances]);

  /* ---------------- UI ---------------- */

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Trip Expense Split (₹)</Text>
        </View>

        {/* Empty State */}
        {participants.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
            </View>
            <Text style={styles.emptyTitle}>Start Splitting Expenses</Text>
            <Text style={styles.emptySubtitle}>
              Add people to your group and track shared expenses easily
            </Text>
          </View>
        )}

        {/* Add Participant */}
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Add participant name"
            placeholderTextColor="#64748B"
            value={participantName}
            onChangeText={setParticipantName}
            onSubmitEditing={addParticipant}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.button} onPress={addParticipant}>
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Participants */}
        {participants.length > 0 && (
          <Text style={styles.sectionTitle}>Group Members ({participants.length})</Text>
        )}
        {participants.map((p) => (
          <View key={p.id} style={styles.participantCard}>
            <Text style={styles.name}>{p.name}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeParticipant(p.id)}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Summary */}
        {participants.length > 0 && expenses.length > 0 && (
          <View style={styles.summary}>
            <Text style={styles.totalText}>Total Group Spending</Text>
            <Text style={styles.totalAmount}>
              ₹{totalExpenses.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Expenses - Google Pay Style */}
        {expenses.length > 0 && (
          <>
            <Text style={styles.section}>Expenses</Text>
            {expenses.map((e) => {
              const sharePerPerson = e.amount / e.splitWith.length;
              return (
                <TouchableOpacity
                  key={e.id}
                  style={styles.expenseCard}
                  onLongPress={() => removeExpense(e.id)}
                >
                  <View style={styles.expenseHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.expenseTitle}>{e.description}</Text>
                      <Text style={styles.expenseMeta}>
                        Paid by {getName(e.paidBy)}
                      </Text>
                    </View>
                    <Text style={styles.expenseAmount}>
                      ₹{e.amount.toFixed(2)}
                    </Text>
                  </View>

                  {/* Split Details */}
                  <View style={styles.splitDetails}>
                    <Text style={styles.splitDetailsHeader}>
                      Split between {e.splitWith.length} {e.splitWith.length === 1 ? "person" : "people"}:
                    </Text>
                    {e.splitWith.map((personId) => (
                      <View key={personId} style={styles.splitRow}>
                        <Text style={styles.splitName}>
                          {getName(personId)}
                          {personId === e.paidBy && " (paid)"}
                        </Text>
                        <Text style={styles.splitShare}>
                          ₹{sharePerPerson.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  <Text style={styles.longPressHint}>Long press to delete</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Final Settlements */}
        {settlements.length > 0 && (
          <>
            <Text style={styles.section}>Who Owes Who (Simplified)</Text>
            <View style={styles.settlementsContainer}>
              {settlements.map((s, i) => (
                <View key={i} style={styles.settlementCard}>
                  <View>
                    <Text style={styles.settlementFrom}>
                      {getName(s.from)}
                    </Text>
                    <Text style={styles.settlementArrow}>owes ↓</Text>
                    <Text style={styles.settlementTo}>
                      {getName(s.to)}
                    </Text>
                  </View>
                  <Text style={styles.settlementAmount}>
                    ₹{s.amount.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Expense */}
      {participants.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowExpenseModal(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Modal */}
      <Modal visible={showExpenseModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modal}
        >
          <ScrollView 
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Expense</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.inputLarge}
                placeholder="What did you buy?"
                placeholderTextColor="#64748B"
                value={expenseDesc}
                onChangeText={setExpenseDesc}
                autoFocus
              />

              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor="#475569"
                  keyboardType="decimal-pad"
                  value={expenseAmount}
                  onChangeText={(text) =>
                    setExpenseAmount(text.replace(/[^0-9.]/g, ""))
                  }
                />
              </View>

              <Text style={styles.modalLabel}>Who Paid?</Text>
              <View style={styles.optionsRow}>
                {participants.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.option,
                      selectedPayer === p.id && styles.optionSelected,
                    ]}
                    onPress={() => setSelectedPayer(p.id)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedPayer === p.id && styles.optionTextSelected,
                      ]}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Split How?</Text>
              
              <TouchableOpacity
                style={[
                  styles.splitOption,
                  splitType === "everyone" && styles.splitOptionSelected,
                ]}
                onPress={() => setSplitType("everyone")}
              >
                <View>
                  <Text style={[
                    styles.splitOptionTitle,
                    splitType === "everyone" && styles.splitOptionTitleSelected,
                  ]}>Split Equally with Everyone</Text>
                  <Text style={styles.splitOptionSub}>
                    {participants.length} people · ₹{expenseAmount ? (parseFloat(expenseAmount) / participants.length).toFixed(2) : "0"} each
                  </Text>
                </View>
                <View style={[
                  styles.radio,
                  splitType === "everyone" && styles.radioSelected,
                ]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.splitOption,
                  splitType === "self" && styles.splitOptionSelected,
                ]}
                onPress={() => setSplitType("self")}
              >
                <View>
                  <Text style={[
                    styles.splitOptionTitle,
                    splitType === "self" && styles.splitOptionTitleSelected,
                  ]}>I Paid for Myself Only</Text>
                  <Text style={styles.splitOptionSub}>No split needed</Text>
                </View>
                <View style={[
                  styles.radio,
                  splitType === "self" && styles.radioSelected,
                ]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.splitOption,
                  splitType === "custom" && styles.splitOptionSelected,
                ]}
                onPress={() => setSplitType("custom")}
              >
                <View style={{flex: 1}}>
                  <Text style={[
                    styles.splitOptionTitle,
                    splitType === "custom" && styles.splitOptionTitleSelected,
                  ]}>Custom Split</Text>
                  <Text style={styles.splitOptionSub}>Choose specific people</Text>
                </View>
                <View style={[
                  styles.radio,
                  splitType === "custom" && styles.radioSelected,
                ]} />
              </TouchableOpacity>

              {splitType === "custom" && (
                <View style={styles.customSplitContainer}>
                  <Text style={styles.customSplitLabel}>Select people:</Text>
                  <View style={styles.optionsRow}>
                    {participants.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.option,
                          selectedSplitters.includes(p.id) && styles.optionSelected,
                        ]}
                        onPress={() => {
                          if (selectedSplitters.includes(p.id)) {
                            setSelectedSplitters(selectedSplitters.filter(id => id !== p.id));
                          } else {
                            setSelectedSplitters([...selectedSplitters, p.id]);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selectedSplitters.includes(p.id) && styles.optionTextSelected,
                          ]}
                        >
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.addButton}
                onPress={addExpense}
              >
                <Text style={styles.addButtonText}>Add Expense</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220", padding: 20 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  backButtonText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "400",
  },

  header: {
    fontSize: 22,
    color: "#FFF",
    fontWeight: "700",
    flex: 1,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },

  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  emptyIcon: {
    fontSize: 56,
  },

  emptyTitle: {
    fontSize: 22,
    color: "#FFF",
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },

  emptySubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },

  sectionTitle: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },

  row: { flexDirection: "row", gap: 10, marginBottom: 20 },

  input: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 12,
    color: "#FFF",
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  button: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 12,
  },

  buttonText: { color: "#FFF", fontWeight: "600" },

  participantCard: {
    backgroundColor: "#0F172A",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },

  name: {
    color: "#FFF",
    fontSize: 16,
    flex: 1,
    fontWeight: "500",
  },

  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },

  removeButtonText: {
    color: "#EF4444",
    fontSize: 18,
    fontWeight: "400",
  },

  summary: {
    backgroundColor: "#0F172A",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: "center",
  },

  totalText: { color: "#94A3B8" },

  totalAmount: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "700",
    marginTop: 6,
  },

  expenseCard: {
    backgroundColor: "#0F172A",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },

  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  expenseTitle: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },

  expenseAmount: {
    color: "#10B981",
    fontSize: 18,
    fontWeight: "700",
  },

  expenseMeta: {
    color: "#94A3B8",
    fontSize: 13,
  },

  splitDetails: {
    backgroundColor: "#1E293B",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },

  splitDetailsHeader: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "600",
  },

  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },

  splitName: {
    color: "#CBD5E1",
    fontSize: 14,
  },

  splitShare: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },

  longPressHint: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 8,
    fontStyle: "italic",
  },

  section: {
    color: "#FFF",
    marginTop: 24,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: "700",
  },

  settlementsContainer: {
    gap: 10,
  },

  settlementCard: {
    backgroundColor: "#0F172A",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },

  settlementFrom: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  settlementArrow: {
    color: "#64748B",
    fontSize: 12,
    marginVertical: 2,
  },

  settlementTo: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  settlementAmount: {
    color: "#F59E0B",
    fontSize: 20,
    fontWeight: "700",
  },

  fab: {
    position: "absolute",
    bottom: 40,
    right: 30,
    backgroundColor: "#3B82F6",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  fabText: { color: "#FFF", fontSize: 30 },

  modal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
  },

  modalScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  modalContent: {
    backgroundColor: "#0F172A",
    padding: 24,
    borderRadius: 20,
    width: "100%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "700",
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },

  closeButtonText: {
    color: "#94A3B8",
    fontSize: 24,
    fontWeight: "300",
  },

  inputLarge: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    color: "#FFF",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },

  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 20,
    paddingHorizontal: 16,
  },

  currencySymbol: {
    color: "#64748B",
    fontSize: 32,
    fontWeight: "700",
    marginRight: 8,
  },

  amountInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 32,
    fontWeight: "700",
    padding: 16,
  },

  modalLabel: {
    color: "#FFF",
    marginTop: 8,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "600",
  },

  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },

  option: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#1E293B",
  },

  optionSelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },

  optionText: {
    color: "#94A3B8",
    fontSize: 14,
  },

  optionTextSelected: {
    color: "#FFF",
    fontWeight: "600",
  },

  splitOption: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "#1E293B",
  },

  splitOptionSelected: {
    backgroundColor: "#1E3A5F",
    borderColor: "#3B82F6",
  },

  splitOptionTitle: {
    color: "#CBD5E1",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },

  splitOptionTitleSelected: {
    color: "#FFF",
  },

  splitOptionSub: {
    color: "#64748B",
    fontSize: 13,
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#475569",
  },

  radioSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "#3B82F6",
  },

  customSplitContainer: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },

  customSplitLabel: {
    color: "#94A3B8",
    fontSize: 14,
    marginBottom: 12,
  },

  addButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },

  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  cancelButton: {
    padding: 16,
    alignItems: "center",
  },

  cancelButtonText: {
    color: "#94A3B8",
    fontSize: 16,
  },
});

