## BlauHoff AF XK-TH
BlauHoff Afore AF XK-TH Three Phase Hybrid Inverter Series

### Input Registers
| Address | Length | Data Type | Unit | Scale | Tranformation | Capability ID | Capability name | Range | DeviceTypes |
| ------- | ------ | --------- | ---- | ----- | ------------- | ------------- | --------------- | ----- | ----------- |
| 0| 6| STRING| | -| No| status_text.inverter_name| Inverter name| - |
| Battery, Inverter |
| 11| 4| STRING| | -| No| status_text.hard_name| Hard name| - |
| Battery, Inverter |
| 535| 2| INT32| W| -| No| measure_power.grid_active_power| Grid active power| -24100 - 24100 |
| Inverter |
| 547| 2| INT32| W| -| No| measure_power.grid_total_load| Grid total load| -24100 - 24100 |
| Inverter |
| 553| 2| UINT32| W| -| No| measure_power| Power| 0 - 24100 |
| Inverter |
| 555| 1| UINT16| V| 0.1| No| measure_voltage.pv1| PV 1 voltage| 0 - 800 |
| Inverter |
| 557| 1| UINT16| W| -| No| measure_power.pv1| PV 1 power| 0 - 15000 |
| Inverter |
| 558| 1| UINT16| V| 0.1| No| measure_voltage.pv2| undefined| 0 - 800 |
| Inverter |
| 560| 1| UINT16| W| -| No| measure_power.pv2| PV 2 power| 0 - 15000 |
| Inverter |
| 2000| 1| UINT16| | -| Yes| status_text.battery_state| Battery state| - |
| Battery |
| 2001| 1| INT16| °C| 0.1| No| measure_temperature.battery1| Battery 1 temperature| -40 - 100 |
| Battery |
| 2002| 1| UINT16| %| -| No| measure_percentage.bat_soc| Battery SOC| 0 - 100 |
| Battery |
| 2002| 1| UINT16| | -| No| measure_battery| undefined| 0 - 100 |
| Battery |
| 2007| 2| INT32| W| -| No| measure_power.battery| Battery power| -24100 - 24100 |
| Battery |
| 2007| 2| INT32| W| -| Yes| measure_power| Power| -24100 - 24100 |
| Battery |
| 2009| 1| UINT16| kWh| 0.1| No| meter_power.daily_battery_charge| Daily battery charge| 0 - 250 |
| Battery |
| 2010| 1| UINT16| kWh| 0.1| No| meter_power.daily_battery_discharge| Daily battery discharge| 0 - 250 |
| Battery |
| 2011| 2| UINT32| kWh| 0.1| No| meter_power.total_battery_charge| Total battery charge| - |
| Battery |
| 2013| 2| UINT32| kWh| 0.1| No| meter_power.total_battery_discharge| Total battery discharge| - |
| Battery |
| 2500| 1| UINT16| | -| No| status_code.running_state| undefined| - |
| Inverter |

### Holding Registers
| Address | Length | Data Type | Unit | Scale | Tranformation | Capability ID | Capability name | Range | DeviceTypes |
| ------- | ------ | --------- | ---- |----- | -------------- | ------------- | --------------- | ----- | ----------- |
| 206| 2| UINT32| | -| Yes| status_text.ac_timing_charge| AC timing charge| - |
| Battery |
| 206| 2| UINT32| | -| Yes| status_text.timing_charge| Timing charge| - |
| Battery |
| 206| 2| UINT32| | -| Yes| status_text.timing_discharge| Timing discharge| - |
| Battery |
| 2500| 1| UINT16| | -| No| status_code.run_mode| Run mode| - |
| Battery |
| 2500| 1| UINT16| | -| Yes| status_text.ems_mode| EMS mode| - |
| Battery |
| 2501| 1| UINT16| | -| Yes| status_text.charge_command| Charge command| - |
| Battery |
| 2502| 2| INT32| W| -| No| measure_power.charge_instructions| Charge command power| - |
| Battery |
| 2504| 1| UINT16| %| 0.1| No| measure_percentage.acpchgmax| AC charge max| 0 - 100 |
| Battery |
| 2505| 1| UINT16| %| 0.1| No| measure_percentage.acsocmaxchg| AC SOC max charge| 0 - 100 |
| Battery |
| 2509| 1| UINT16| | -| Yes| timeslot.time| undefined| - |
| Battery |
| 2510| 1| UINT16| | -| No| timeslot.time| undefined| - |
| Battery |
| 2511| 1| UINT16| | -| No| timeslot.time| undefined| - |
| Battery |
| 2512| 1| UINT16| | -| No| timeslot.time| undefined| - |
| Battery |
| 2513| 1| UINT16| | -| No| timeslot.time| undefined| - |
| Battery |
| 2514| 1| UINT16| | -| No| timeslot.time| undefined| - |
| Battery |
| 2515| 1| UINT16| | -| No| timeslot.time| undefined| - |
| Battery |
| 2516| 1| UINT16| | -| No| timeslot.time| undefined| - |
| Battery |

### Supported flow actions

#### Write value to register
Write [[value]] to [[registerType]] register [[register]]
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| value | Value | number | - |
| registerType | The register type where to write to | dropdown | - |
| register | Register | autocomplete | - |

#### Set charge command with power
Set EMS mode to Charge Command with the command [[charge_command]] using [[value]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| charge_command | Charge command | dropdown | Select the charge command to set. |
| value | Watts | range | - |

#### Set EMS mode
Set EMS mode to [[mode]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| mode | EMS mode | dropdown | - |

#### Set times of AC charging timeslot
For timeslot [[timeslot]] set the start time to [[starttime]] and the end time to [[endtime]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| timeslot | Timeslot | dropdown | - |
| starttime | Time | time | - |
| endtime | Time | time | - |

#### Set Timing AC Charge OFF
Set timing AC charge OFF.

#### Set timing AC charge ON with values.
Set timing AC charging ON with [[acpchgmax]] AcPChgMax and [[acsocmaxchg]] AcSocMaxChg.
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| acpchgmax | AcPChgMax | range | - |
| acsocmaxchg | AcPChgMax | range | - |

