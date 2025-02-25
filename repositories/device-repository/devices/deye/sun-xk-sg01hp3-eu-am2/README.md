## BlauHoff Sun *K SG01HP3 EU AM2
BlauHoff Deye Sun *K SG01HP3 EU AM2 Series

### Input Registers Inverter
| Address | Length | Data Type | Unit | Scale | Tranformation | Capability ID | Capability name | Range | DeviceTypes |
| ------- | ------ | --------- | ---- | ----- | ------------- | ------------- | --------------- | ----- | ----------- |
### Input Registers Battery
| Address | Length | Data Type | Unit | Scale | Tranformation | Capability ID | Capability name | Range | DeviceTypes |
| ------- | ------ | --------- | ---- | ----- | ------------- | ------------- | --------------- | ----- | ----------- |
### Holding Registers Inverter
| Address | Length | Data Type | Unit | Scale | Tranformation | Capability ID | Capability name | Range | DeviceTypes |
| ------- | ------ | --------- | ---- | ----- | ------------- | ------------- | --------------- | ----- | ----------- |
| 1| 1| UINT16| | -| No| status_code.modbus_address| Modbus address| -| Inverter |
| 2| 1| UINT16| | -| No| status_code.modbus_protocol| Modbus version| -| Inverter |
| 3| 5| STRING| | -| No| serial| Serial number| -| Inverter |
| 104| 1| UINT16| | 10| No| status_code.zero_export_power| undefined| -| Inverter |
| 141| 1| UINT16| | -| Yes| status_text.energie_management_model| undefined| -| Inverter |
| 142| 1| UINT16| | -| Yes| status_text.work_mode| undefined| -| Inverter |
| 143| 1| UINT16| | 10| No| status_code.max_sell_power| Max selling power| -| Inverter |
| 145| 1| UINT16| | -| Yes| status_text.sell_solar| Sell solar| -| Inverter |
| 146| 1| UINT16| | -| Yes| status_text.time_of_use| Time of use| -| Inverter |
| 148| 1| UINT16| | -| Yes| status_text.tou_time1| ToU Time 1| -| Inverter |
| 149| 1| UINT16| | -| Yes| status_text.tou_time2| ToU Time 2| -| Inverter |
| 150| 1| UINT16| | -| Yes| status_text.tou_time3| ToU Time 3| -| Inverter |
| 151| 1| UINT16| | -| Yes| status_text.tou_time4| ToU Time 4| -| Inverter |
| 152| 1| UINT16| | -| Yes| status_text.tou_time5| ToU Time 5| -| Inverter |
| 153| 1| UINT16| | -| Yes| status_text.tou_time6| ToU Time 6| -| Inverter |
| 154| 1| UINT16| W| 10| No| measure_power.powerlimit1| Power limit 1| -| Inverter |
| 155| 1| UINT16| W| 10| No| measure_power.powerlimit2| Power limit 2| -| Inverter |
| 156| 1| UINT16| W| 10| No| measure_power.powerlimit3| Power limit 3| -| Inverter |
| 157| 1| UINT16| W| 10| No| measure_power.powerlimit4| Power limit 4| -| Inverter |
| 158| 1| UINT16| W| 10| No| measure_power.powerlimit5| Power limit 5| -| Inverter |
| 159| 1| UINT16| W| 10| No| measure_power.powerlimit6| Power limit 6| -| Inverter |
| 166| 1| UINT16| %| -| No| measure_percentage.tou_battery1| ToU Battery 1| -| Inverter |
| 167| 1| UINT16| %| -| No| measure_percentage.tou_battery2| ToU Battery 2| -| Inverter |
| 168| 1| UINT16| %| -| No| measure_percentage.tou_battery3| ToU Battery 3| -| Inverter |
| 169| 1| UINT16| %| -| No| measure_percentage.tou_battery4| ToU Battery 4| -| Inverter |
| 170| 1| UINT16| %| -| No| measure_percentage.tou_battery5| ToU Battery 5| -| Inverter |
| 171| 1| UINT16| %| -| No| measure_percentage.tou_battery6| ToU Battery 6| -| Inverter |
| 172| 1| UINT16| | -| Yes| status_text.grid_charging1| Grid charging 1| -| Inverter |
| 172| 1| UINT16| | -| Yes| status_text.generator_charging1| Generator charging 1| -| Inverter |
| 173| 1| UINT16| | -| Yes| status_text.grid_charging2| Grid charging 2| -| Inverter |
| 173| 1| UINT16| | -| Yes| status_text.generator_charging2| Generator charging 2| -| Inverter |
| 174| 1| UINT16| | -| Yes| status_text.grid_charging3| Grid charging 3| -| Inverter |
| 174| 1| UINT16| | -| Yes| status_text.generator_charging3| Generator charging 3| -| Inverter |
| 175| 1| UINT16| | -| Yes| status_text.grid_charging4| Grid charging 4| -| Inverter |
| 175| 1| UINT16| | -| Yes| status_text.generator_charging4| Generator charging 4| -| Inverter |
| 176| 1| UINT16| | -| Yes| status_text.grid_charging5| Grid charging 5| -| Inverter |
| 176| 1| UINT16| | -| Yes| status_text.generator_charging5| Generator charging 5| -| Inverter |
| 177| 1| UINT16| | -| Yes| status_text.grid_charging6| Grid charging 6| -| Inverter |
| 177| 1| UINT16| | -| Yes| status_text.generator_charging6| Generator charging 6| -| Inverter |
| 178| 1| UINT16| | -| Yes| status_text.grid_peak_shaving| Grid peak shaving| -| Inverter |
| 191| 1| UINT16| | 10| No| status_code.grid_peak_shaving_power| undefined| -| Inverter |
| 340| 1| UINT16| | 10| No| status_code.max_solar_power| undefined| -| Inverter |
| 500| 1| UINT16| | -| Yes| status_text.run_mode| Run mode| -| Inverter |
| 520| 1| UINT16| kWh| 0.1| No| meter_power.daily_from_grid| Daily from grid| -| Inverter |
| 521| 1| UINT16| kWh| 0.1| No| meter_power.daily_to_grid| Daily to grid| -| Inverter |
| 522| 1| UINT16| kWh| 0.1| No| meter_power.total_from_grid| Total from grid| -| Inverter |
| 524| 1| UINT16| kWh| 0.1| No| meter_power.total_to_grid| Total to grid| -| Inverter |
| 526| 1| UINT16| kWh| 0.1| No| meter_power.daily_to_load| Daily to load| -| Inverter |
| 527| 1| UINT16| kWh| 0.1| No| meter_power.total_to_load| Total to load| -| Inverter |
| 529| 1| UINT16| kWh| 0.1| No| meter_power.daily_pv| Daily PV| -| Inverter |
| 534| 2| UINT16| kWh| 0.1| No| meter_power.total_pv| Total PV| -| Inverter |
| 541| 1| UINT16| °C| 0.01| No| measure_temperature.ac| AC temperature| -| Inverter |
| 598| 1| UINT16| V| 0.1| No| measure_voltage.grid_l1| Grid L1 voltage| -| Inverter |
| 599| 1| UINT16| V| 0.1| No| measure_voltage.grid_l2| Grid L2 voltage| -| Inverter |
| 600| 1| UINT16| V| 0.1| No| measure_voltage.grid_l3| Grid L3 voltage| -| Inverter |
| 625| 1| UINT16| W| -| No| measure_power.grid| Grid output power| -| Inverter |
| 636| 1| INT16| W| -| No| measure_power.inverter| Inverter power| -| Inverter |
| 643| 1| UINT16| W| -| No| measure_power.ups| undefined| -| Inverter |
| 653| 1| INT16| W| -| No| measure_power.load| Load power| -| Inverter |
| 672| 1| UINT16| W| 10| No| measure_power.pv1| PV 1 power| -| Inverter |
| 673| 1| UINT16| W| 10| No| measure_power.pv2| PV 2 power| -| Inverter |
### Holding Registers Battery
| Address | Length | Data Type | Unit | Scale | Tranformation | Capability ID | Capability name | Range | DeviceTypes |
| ------- | ------ | --------- | ---- | ----- | ------------- | ------------- | --------------- | ----- | ----------- |
| 514| 1| UINT16| kWh| 0.1| No| meter_power.daily_battery_charge| Daily battery charge| -| Battery |
| 515| 1| UINT16| kWh| 0.1| No| meter_power.daily_battery_discharge| Daily battery discharge| -| Battery |
| 516| 1| UINT16| kWh| 0.1| No| meter_power.total_battery_charge| Total battery charge| -| Battery |
| 518| 1| UINT16| kWh| 0.1| No| meter_power.total_battery_discharge| Total battery discharge| -| Battery |
| 540| 1| UINT16| °C| 0.01| No| measure_temperature.dc| DC temperature| -| Battery |
| 586| 1| UINT16| °C| 0.01| No| measure_temperature.battery1| Battery 1 temperature| -| Battery |
| 587| 1| INT16| V| 0.1| No| measure_voltage.battery1| Battery 1 voltage| -| Battery |
| 588| 1| UINT16| %| -| No| measure_percentage.battery1| undefined| -| Battery |
| 588| 1| UINT16| | -| No| measure_battery| undefined| -| Battery |
| 590| 1| INT16| W| 10| No| measure_power.battery1| Battery 1 power| -| Battery |
| 590| 1| INT16| W| -| Yes| measure_power| Power| -| Battery |
| 591| 1| INT16| A| 0.01| No| measure_current.battery1| Battery 1 current| -| Battery |

### Supported flow actions

#### Set max solar power
Set max solar power to [[value]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| value | Watts | range | - |

#### Set solar selling
Set solar selling to [[enabled]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| enabled | Solar selling | checkbox | - |

#### Set max sell power
Set max sell power to [[value]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| value | Watts | range | - |

#### Write value to register
Write [[value]] to [[registerType]] register [[register]]
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| value | Value | number | - |
| registerType | The register type where to write to | dropdown | - |
| register | Register | autocomplete | - |

#### Set energy pattern
Set energy pattern to [[value]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| value | Energy pattern | dropdown | - |

#### Set grid peak shaving on
Set grid peak shaving on with [[value]] power.
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| value | Watts | range | - |

#### Set grid peak shaving off
Set grid peak shaving off.

#### Set work mode and zero export power
Set workmode to [[workmode]] and Zero Export Power to [[value]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| value | Watts | range | - |
| workmode | Workmode | dropdown | - |

#### Turn time of use on/off
Set time of use to [[enabled]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| enabled | Time of use | dropdown | - |

#### Turn time of use on/off for this day
Set time of use to [[enabled]] for [[day]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| enabled | Time of use | dropdown | - |
| day | Day | dropdown | - |

#### Set time of use parameters for timeslot
For timeslot [[timeslot]] set the start time to [[time]]. Set grid charge to [[gridcharge]] and generator charge to [[generatorcharge]]. Power limit is [[powerlimit]] and minimum battery charge is [[batterycharge]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| timeslot | Timeslot | dropdown | - |
| time | Time | time | - |
| gridcharge | Grid charging | dropdown | - |
| generatorcharge | Generator charging | dropdown | - |
| powerlimit | Power limit | range | - |
| batterycharge | Minimum battery charge | range | - |

#### Set time of use parameters for all timeslots
For all timeslots, set grid charge to [[gridcharge]] and generator charge to [[generatorcharge]]. Power limit is [[powerlimit]] and minimum battery charge is [[batterycharge]].
| Name | Argument | Type |  Description |
| ------------- | ----- | ------------- | --------------- |
| gridcharge | Grid charging | dropdown | - |
| generatorcharge | Generator charging | dropdown | - |
| powerlimit | Power limit | range | - |
| batterycharge | Minimum battery charge | range | - |

