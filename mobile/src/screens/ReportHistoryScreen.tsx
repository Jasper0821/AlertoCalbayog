import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Header from "../components/Header";
import { COLORS } from "../styles/colors";
import api from "../api/axios";
import { getToken } from "../utils/Storage";

interface Report {
  _id: string;
  emergencyType: string;
  status: string;
  assignedAgency?: string;
}

export default function ReportHistoryScreen(): React.JSX.Element {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = await getToken();

      const res = await api.get("/emergency", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setReports(res.data);
    } catch (error: any) {
      console.log(error.response?.data || error.message);
    }
  };

  const getStatusColor = (status: any) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return COLORS.green;
      case 'responding': return COLORS.blue;
      case 'pending': return COLORS.primary;
      default: return COLORS.textGray;
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Report History" />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {reports.length === 0 ? (
          <Text style={styles.emptyText}>No emergency reports found.</Text>
        ) : (
          reports.map((report) => (
            <View key={report._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.typeText}>{report.emergencyType.toUpperCase()}</Text>
                <View style={[styles.statusBadge, { borderColor: getStatusColor(report.status), backgroundColor: `${getStatusColor(report.status)}15` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                    {report.status || 'Pending'}
                  </Text>
                </View>
              </View>
              <View style={styles.separator} />
              
              <Text style={styles.detailText}>
                <Text style={styles.label}>Agency: </Text>
                {report.assignedAgency || "Awaiting Assignment"}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  emptyText: {
    color: COLORS.textGray,
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  detailText: {
    color: COLORS.white,
    fontSize: 14,
  },
  label: {
    color: COLORS.textGray,
    fontWeight: "600",
  }
});